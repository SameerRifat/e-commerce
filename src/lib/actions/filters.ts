// src/lib/actions/filters.ts (FIXED version)
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
  productVariants,
} from "@/lib/db/schema";
import { sql, eq, and, inArray, or } from "drizzle-orm";
import { NormalizedProductFilters } from "@/lib/utils/query";

export type FilterOption = {
  id: string;
  name: string;
  slug: string;
  count: number;
  disabled?: boolean;
  hexCode?: string;
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
      count: sql<number>`count(distinct ${products.id})::int`,
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
      count: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .where(and(...baseConditions))
    .groupBy(brands.id, brands.name, brands.slug);

  // Get category options with counts (only root categories)
  const categoriesQuery = db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...baseConditions, sql`${categories.parentId} IS NULL`))
    .groupBy(categories.id, categories.name, categories.slug);

  // FIXED: Color options - now includes products without variants (configurable only)
  const colorsQuery = db
    .select({
      id: colors.id,
      name: colors.name,
      slug: colors.slug,
      hexCode: colors.hexCode,
      count: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .innerJoin(colors, eq(colors.id, productVariants.colorId))
    .where(
      and(
        ...baseConditions,
        eq(products.productType, 'configurable') // Only configurable products have color variants
      )
    )
    .groupBy(colors.id, colors.name, colors.slug, colors.hexCode);

  // FIXED: Sizes - only for configurable products
  const sizesQuery = db
    .select({
      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sortOrder: sizes.sortOrder,
      categoryId: sizeCategories.id,
      categoryName: sizeCategories.name,
      count: sql<number>`count(distinct ${products.id})::int`,
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .innerJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(sizeCategories, eq(sizeCategories.id, sizes.categoryId))
    .where(
      and(
        ...baseConditions,
        eq(products.productType, 'configurable')
      )
    )
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
  const [gendersResult, brandsResult, categoriesResult, colorsResult, sizesResult] =
    await Promise.all([
      gendersQuery,
      brandsQuery,
      categoriesQuery,
      colorsQuery,
      sizesQuery,
    ]);

  // Process size results into groups
  const sizeGroups: SizeGroup[] = [];
  const sizeGroupMap = new Map<string, SizeGroup>();

  sizesResult.forEach((size) => {
    const categoryId = size.categoryId || "general";
    const categoryName = size.categoryName || "General";

    if (!sizeGroupMap.has(categoryId)) {
      const group: SizeGroup = {
        categoryId,
        categoryName,
        sizes: [],
      };
      sizeGroupMap.set(categoryId, group);
      sizeGroups.push(group);
    }

    sizeGroupMap.get(categoryId)!.sizes.push({
      id: size.sizeId,
      name: size.sizeName,
      slug: size.sizeSlug,
      count: size.count,
    });
  });

  // FIXED: Calculate price ranges with single optimized query
  // This query handles both simple and configurable products
  const priceData = await db
    .select({
      minPrice: sql<number>`
        min(
          CASE 
            WHEN ${products.productType} = 'simple' THEN ${products.price}::numeric
            ELSE ${productVariants.price}::numeric
          END
        )
      `,
      maxPrice: sql<number>`
        max(
          CASE 
            WHEN ${products.productType} = 'simple' THEN ${products.price}::numeric
            ELSE ${productVariants.price}::numeric
          END
        )
      `,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(products.productType, 'configurable')
      )
    )
    .where(and(...baseConditions));

  const minPrice = Number(priceData[0]?.minPrice || 0);
  const maxPrice = Number(priceData[0]?.maxPrice || 1000);

  // Create dynamic price ranges for Pakistan (PKR)
  const priceRangesDef = [
    { id: "0-1000", label: "PKR 0 - 1,000", min: 0, max: 1000 },
    { id: "1000-2500", label: "PKR 1,000 - 2,500", min: 1000, max: 2500 },
    { id: "2500-5000", label: "PKR 2,500 - 5,000", min: 2500, max: 5000 },
    { id: "5000-10000", label: "PKR 5,000 - 10,000", min: 5000, max: 10000 },
    { id: "10000-", label: "Over PKR 10,000", min: 10000 },
  ].filter((range) => {
    if (range.max && range.min > maxPrice) return false;
    if (range.min < minPrice && range.max && range.max < minPrice) return false;
    return true;
  });

  // FIXED: Single query with conditional aggregation for all price ranges (PKR)
  const priceRangeCounts = await db
    .select({
      range_0_1000: sql<number>`
        count(distinct CASE 
          WHEN (
            CASE 
              WHEN ${products.productType} = 'simple' 
              THEN COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
              ELSE COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)
            END
          ) BETWEEN 0 AND 1000 
          THEN ${products.id} 
        END)::int
      `,
      range_1000_2500: sql<number>`
        count(distinct CASE 
          WHEN (
            CASE 
              WHEN ${products.productType} = 'simple' 
              THEN COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
              ELSE COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)
            END
          ) BETWEEN 1000 AND 2500 
          THEN ${products.id} 
        END)::int
      `,
      range_2500_5000: sql<number>`
        count(distinct CASE 
          WHEN (
            CASE 
              WHEN ${products.productType} = 'simple' 
              THEN COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
              ELSE COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)
            END
          ) BETWEEN 2500 AND 5000 
          THEN ${products.id} 
        END)::int
      `,
      range_5000_10000: sql<number>`
        count(distinct CASE 
          WHEN (
            CASE 
              WHEN ${products.productType} = 'simple' 
              THEN COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
              ELSE COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)
            END
          ) BETWEEN 5000 AND 10000 
          THEN ${products.id} 
        END)::int
      `,
      range_10000_plus: sql<number>`
        count(distinct CASE 
          WHEN (
            CASE 
              WHEN ${products.productType} = 'simple' 
              THEN COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
              ELSE COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)
            END
          ) >= 10000 
          THEN ${products.id} 
        END)::int
      `,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(products.productType, 'configurable')
      )
    )
    .where(and(...baseConditions));

  const countsMap: Record<string, number> = {
    "0-1000": priceRangeCounts[0]?.range_0_1000 || 0,
    "1000-2500": priceRangeCounts[0]?.range_1000_2500 || 0,
    "2500-5000": priceRangeCounts[0]?.range_2500_5000 || 0,
    "5000-10000": priceRangeCounts[0]?.range_5000_10000 || 0,
    "10000-": priceRangeCounts[0]?.range_10000_plus || 0,
  };

  const priceRangesWithCounts = priceRangesDef.map((range) => ({
    ...range,
    count: countsMap[range.id] || 0,
  }));

  return {
    genders: gendersResult.map((g) => ({
      id: g.id,
      name: g.label,
      slug: g.slug,
      count: g.count,
      disabled: g.count === 0,
    })),
    brands: brandsResult.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      count: b.count,
      disabled: b.count === 0,
    })),
    categories: categoriesResult.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
      disabled: c.count === 0,
    })),
    colors: colorsResult.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      hexCode: c.hexCode,
      count: c.count,
      disabled: c.count === 0,
    })),
    sizes: sizeGroups,
    priceRanges: priceRangesWithCounts,
  };
}