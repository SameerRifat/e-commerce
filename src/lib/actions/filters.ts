// src/lib/actions/filters.ts
"use server";

import { db } from "@/lib/db";
import {
    brands,
    categories,
    genders,
    colors,
    sizes,
    sizeCategories,
    products,
    productVariants
} from "@/lib/db/schema";
import { sql, eq, and, inArray, isNotNull } from "drizzle-orm";
import { NormalizedProductFilters } from "@/lib/utils/query";

export type FilterOption = {
    id: string;
    name: string;
    slug: string;
    count: number;
    disabled?: boolean;
};

export type FilterGroup = {
    key: string;
    label: string;
    options: FilterOption[];
};

export type SizeGroup = {
    categoryId: string;
    categoryName: string;
    sizes: FilterOption[];
};

export type FilterOptionsResult = {
    genders: FilterOption[];
    brands: FilterOption[];
    categories: FilterOption[];
    colors: FilterOption[];
    sizes: SizeGroup[];
    priceRanges: Array<{
        id: string;
        label: string;
        min: number;
        max?: number;
        count: number;
    }>;
};

export async function getFilterOptions(
    currentFilters?: NormalizedProductFilters
): Promise<FilterOptionsResult> {
    // Build base conditions for published products
    const baseConditions = [eq(products.isPublished, true)];

    // Apply current filters to get contextual counts
    if (currentFilters?.search) {
        const pattern = `%${currentFilters.search}%`;
        baseConditions.push(
            sql`(${products.name} ILIKE ${pattern} OR ${products.description} ILIKE ${pattern})`
        );
    }

    // Get gender options with counts
    const gendersQuery = db
        .select({
            id: genders.id,
            label: genders.label,
            slug: genders.slug,
            count: sql<number>`count(distinct ${products.id})::int`
        })
        .from(products)
        .innerJoin(genders, eq(genders.id, products.genderId))
        .where(and(...baseConditions))
        .groupBy(genders.id, genders.label, genders.slug);

    // Get brand options with counts
    const brandsQuery = db
        .select({
            id: brands.id,
            name: brands.name,
            slug: brands.slug,
            count: sql<number>`count(distinct ${products.id})::int`
        })
        .from(products)
        .innerJoin(brands, eq(brands.id, products.brandId))
        .where(and(...baseConditions))
        .groupBy(brands.id, brands.name, brands.slug);

    // Get category options with counts (only root categories for simplicity)
    const categoriesQuery = db
        .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            count: sql<number>`count(distinct ${products.id})::int`
        })
        .from(products)
        .innerJoin(categories, eq(categories.id, products.categoryId))
        .where(and(...baseConditions, sql`${categories.parentId} IS NULL`))
        .groupBy(categories.id, categories.name, categories.slug);

    // Get color options with counts (from variants)
    const colorsQuery = db
        .select({
            id: colors.id,
            name: colors.name,
            slug: colors.slug,
            hexCode: colors.hexCode,
            count: sql<number>`count(distinct ${products.id})::int`
        })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(colors, eq(colors.id, productVariants.colorId))
        .where(and(...baseConditions))
        .groupBy(colors.id, colors.name, colors.slug, colors.hexCode);

    // Get sizes with categories and counts
    const sizesQuery = db
        .select({
            sizeId: sizes.id,
            sizeName: sizes.name,
            sizeSlug: sizes.slug,
            sortOrder: sizes.sortOrder,
            categoryId: sizeCategories.id,
            categoryName: sizeCategories.name,
            count: sql<number>`count(distinct ${products.id})::int`
        })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
        .leftJoin(sizeCategories, eq(sizeCategories.id, sizes.categoryId))
        .where(and(...baseConditions))
        .groupBy(
            sizes.id,
            sizes.name,
            sizes.slug,
            sizes.sortOrder,
            sizeCategories.id,
            sizeCategories.name
        )
        .orderBy(sizes.sortOrder);

    // Execute all queries in parallel
    const [
        gendersResult,
        brandsResult,
        categoriesResult,
        colorsResult,
        sizesResult
    ] = await Promise.all([
        gendersQuery,
        brandsQuery,
        categoriesQuery,
        colorsQuery,
        sizesQuery
    ]);

    // Process size results into groups
    const sizeGroups: SizeGroup[] = [];
    const sizeGroupMap = new Map<string, SizeGroup>();

    sizesResult.forEach(size => {
        const categoryId = size.categoryId || 'general';
        const categoryName = size.categoryName || 'General';

        if (!sizeGroupMap.has(categoryId)) {
            const group: SizeGroup = {
                categoryId,
                categoryName,
                sizes: []
            };
            sizeGroupMap.set(categoryId, group);
            sizeGroups.push(group);
        }

        sizeGroupMap.get(categoryId)!.sizes.push({
            id: size.sizeId,
            name: size.sizeName,
            slug: size.sizeSlug,
            count: size.count
        });
    });

    // Calculate price ranges dynamically
    const priceRangeQuery = await db
        .select({
            minPrice: sql<number>`min(${productVariants.price}::numeric)`,
            maxPrice: sql<number>`max(${productVariants.price}::numeric)`
        })
        .from(products)
        .innerJoin(productVariants, eq(productVariants.productId, products.id))
        .where(and(...baseConditions));

    const priceData = priceRangeQuery[0];
    const minPrice = Number(priceData?.minPrice || 0);
    const maxPrice = Number(priceData?.maxPrice || 1000);

    // Create dynamic price ranges
    const priceRanges = [
        { id: '0-50', label: '$0 - $50', min: 0, max: 50 },
        { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
        { id: '100-150', label: '$100 - $150', min: 100, max: 150 },
        { id: '150-200', label: '$150 - $200', min: 150, max: 200 },
        { id: '200-', label: 'Over $200', min: 200 }
    ].filter(range => {
        // Only include ranges that make sense given actual price data
        if (range.max && range.min > maxPrice) return false;
        if (range.min < minPrice && range.max && range.max < minPrice) return false;
        return true;
    });

    // Get counts for each price range
    const priceRangesWithCounts = await Promise.all(
        priceRanges.map(async range => {
            const conditions = [...baseConditions];

            if (range.max) {
                conditions.push(
                    sql`${productVariants.price}::numeric >= ${range.min} AND ${productVariants.price}::numeric <= ${range.max}`
                );
            } else {
                conditions.push(sql`${productVariants.price}::numeric >= ${range.min}`);
            }

            const countResult = await db
                .select({
                    count: sql<number>`count(distinct ${products.id})::int`
                })
                .from(products)
                .innerJoin(productVariants, eq(productVariants.productId, products.id))
                .where(and(...conditions));

            return {
                ...range,
                count: countResult[0]?.count || 0
            };
        })
    );

    return {
        genders: gendersResult.map(g => ({
            id: g.id,
            name: g.label,
            slug: g.slug,
            count: g.count,
            disabled: g.count === 0
        })),
        brands: brandsResult.map(b => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            count: b.count,
            disabled: b.count === 0
        })),
        categories: categoriesResult.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            count: c.count,
            disabled: c.count === 0
        })),
        colors: colorsResult.map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            hexCode: c.hexCode,
            count: c.count,
            disabled: c.count === 0
        })),
        sizes: sizeGroups,
        priceRanges: priceRangesWithCounts
    };
}