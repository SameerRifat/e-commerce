// src/lib/actions/collection-filter-options.ts
"use server";

import { db } from "@/lib/db";
import {
  collections,
  productCollections,
  products,
  brands,
  categories,
  colors,
  sizes,
  genders,
  productVariants,
} from "@/lib/db/schema";
import { eq, and, sql, inArray, isNotNull } from "drizzle-orm";
import type { FilterOption, SizeGroup } from "@/lib/actions/filters";

export type CollectionFilterOptionsResult = {
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

/**
 * Get available filter options for products within a specific collection
 * Industry pattern: Collection-scoped filters (Shopify, WooCommerce)
 * Only shows filters for products actually in this collection
 */
export async function getCollectionFilterOptions(
  collectionSlug: string
): Promise<CollectionFilterOptionsResult> {
  try {
    // 1. Get collection
    const [collection] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(and(eq(collections.slug, collectionSlug), eq(collections.isPublished, true)))
      .limit(1);

    if (!collection) {
      return {
        genders: [],
        brands: [],
        categories: [],
        colors: [],
        sizes: [],
        priceRanges: [],
      };
    }

    // 2. Get all product IDs in this collection
    const productIdsInCollection = await db
      .select({ productId: productCollections.productId })
      .from(productCollections)
      .innerJoin(
        products,
        and(
          eq(products.id, productCollections.productId),
          eq(products.isPublished, true)
        )
      )
      .where(eq(productCollections.collectionId, collection.id));

    const productIds = productIdsInCollection.map((p) => p.productId);

    if (productIds.length === 0) {
      return {
        genders: [],
        brands: [],
        categories: [],
        colors: [],
        sizes: [],
        priceRanges: [],
      };
    }

    // 3. Get genders used in collection products
    const gendersData = await db
      .select({
        genderId: genders.id,
        genderSlug: genders.slug,
        genderLabel: genders.label,
        count: sql<number>`count(distinct ${products.id})::int`.as("count"),
      })
      .from(products)
      .innerJoin(genders, eq(genders.id, products.genderId))
      .where(and(inArray(products.id, productIds), isNotNull(products.genderId)))
      .groupBy(genders.id, genders.slug, genders.label)
      .orderBy(genders.label);

    const genderOptions: FilterOption[] = gendersData.map((g) => ({
      id: g.genderId,
      name: g.genderLabel,
      slug: g.genderSlug,
      count: Number(g.count),
    }));

    // 4. Get brands used in collection products
    const brandsData = await db
      .select({
        id: brands.id,
        slug: brands.slug,
        name: brands.name,
        count: sql<number>`count(distinct ${products.id})::int`.as("count"),
      })
      .from(brands)
      .innerJoin(products, eq(products.brandId, brands.id))
      .where(inArray(products.id, productIds))
      .groupBy(brands.id, brands.slug, brands.name)
      .orderBy(brands.name);

    const brandOptions: FilterOption[] = brandsData.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      count: Number(b.count),
    }));

    // 5. Get categories used in collection products
    const categoriesData = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        count: sql<number>`count(distinct ${products.id})::int`.as("count"),
      })
      .from(categories)
      .innerJoin(products, eq(products.categoryId, categories.id))
      .where(inArray(products.id, productIds))
      .groupBy(categories.id, categories.slug, categories.name)
      .orderBy(categories.name);

    const categoryOptions: FilterOption[] = categoriesData.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: Number(c.count),
    }));

    // 6. Get colors used in collection products (via product variants)
    const colorsData = await db
      .select({
        id: colors.id,
        slug: colors.slug,
        name: colors.name,
        hexCode: colors.hexCode,
        count: sql<number>`count(distinct ${productVariants.productId})::int`.as(
          "count"
        ),
      })
      .from(colors)
      .innerJoin(productVariants, eq(productVariants.colorId, colors.id))
      .where(inArray(productVariants.productId, productIds))
      .groupBy(colors.id, colors.slug, colors.name, colors.hexCode)
      .orderBy(colors.name);

    const colorOptions: FilterOption[] = colorsData.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: Number(c.count),
      hexCode: c.hexCode || undefined,
    }));

    // 7. Get sizes used in collection products (via product variants)
    const sizesData = await db
      .select({
        sizeId: sizes.id,
        sizeSlug: sizes.slug,
        sizeName: sizes.name,
        sizeOrder: sizes.sortOrder,
        categoryId: sizes.categoryId,
        categoryName: sql<string>`max(${sql.raw(
          "size_categories.name"
        )})`.as("category_name"),
        count: sql<number>`count(distinct ${productVariants.productId})::int`.as(
          "count"
        ),
      })
      .from(sizes)
      .innerJoin(productVariants, eq(productVariants.sizeId, sizes.id))
      .leftJoin(
        sql.raw("size_categories"),
        sql`${sizes.categoryId} = size_categories.id`
      )
      .where(inArray(productVariants.productId, productIds))
      .groupBy(
        sizes.id,
        sizes.slug,
        sizes.name,
        sizes.sortOrder,
        sizes.categoryId
      )
      .orderBy(sizes.categoryId, sizes.sortOrder);

    // Group sizes by category
    const sizesByCategory = new Map<string, FilterOption[]>();

    sizesData.forEach((s) => {
      const categoryKey = s.categoryId || "other";

      if (!sizesByCategory.has(categoryKey)) {
        sizesByCategory.set(categoryKey, []);
      }

      sizesByCategory.get(categoryKey)!.push({
        id: s.sizeId,
        name: s.sizeName,
        slug: s.sizeSlug,
        count: Number(s.count),
      });
    });

    const sizeGroups: SizeGroup[] = Array.from(
      sizesByCategory.entries()
    ).map(([categoryId, sizes]) => {
      const categoryData = sizesData.find(
        (s) => (s.categoryId || "other") === categoryId
      );
      return {
        categoryId: categoryId,
        categoryName: categoryData?.categoryName || "Other Sizes",
        sizes,
      };
    });

    // 8. Calculate price ranges based on collection products
    const pricesData = await db
      .select({
        minPrice: sql<number>`min(
                    CASE
                        WHEN ${products.productType} = 'simple'
                        THEN COALESCE(${products.salePrice}, ${products.price})::numeric
                        ELSE NULL
                    END
                )`.as("min_price"),
        maxPrice: sql<number>`max(
                    CASE
                        WHEN ${products.productType} = 'simple'
                        THEN COALESCE(${products.salePrice}, ${products.price})::numeric
                        ELSE NULL
                    END
                )`.as("max_price"),
      })
      .from(products)
      .where(inArray(products.id, productIds));

    // Also get variant prices
    const variantPricesData = await db
      .select({
        minPrice:
          sql<number>`min(COALESCE(${productVariants.salePrice}, ${productVariants.price})::numeric)`.as(
            "min_price"
          ),
        maxPrice:
          sql<number>`max(COALESCE(${productVariants.salePrice}, ${productVariants.price})::numeric)`.as(
            "max_price"
          ),
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(inArray(products.id, productIds));

    const minPrice = Math.min(
      Number(pricesData[0]?.minPrice || Infinity),
      Number(variantPricesData[0]?.minPrice || Infinity)
    );
    const maxPrice = Math.max(
      Number(pricesData[0]?.maxPrice || 0),
      Number(variantPricesData[0]?.maxPrice || 0)
    );

    // Generate price range options
    const priceRanges: Array<{
      id: string;
      label: string;
      min: number;
      max?: number;
      count: number;
    }> = [];
    if (minPrice !== Infinity && maxPrice > 0) {
      const ranges = [
        { id: "0-1000", min: 0, max: 1000, label: "Under PKR 1,000" },
        { id: "1000-2500", min: 1000, max: 2500, label: "PKR 1,000 - 2,500" },
        { id: "2500-5000", min: 2500, max: 5000, label: "PKR 2,500 - 5,000" },
        { id: "5000-10000", min: 5000, max: 10000, label: "PKR 5,000 - 10,000" },
        { id: "10000-", min: 10000, max: undefined, label: "Over PKR 10,000" },
      ];

      for (const range of ranges) {
        if (
          (range.max === undefined && maxPrice >= range.min) ||
          (range.max !== undefined &&
            ((minPrice <= range.max && maxPrice >= range.min) ||
              (minPrice >= range.min && minPrice <= range.max)))
        ) {
          priceRanges.push({
            id: range.id,
            label: range.label,
            min: range.min,
            max: range.max,
            count: 0, // Could calculate exact counts if needed
          });
        }
      }
    }

    return {
      genders: genderOptions,
      brands: brandOptions,
      categories: categoryOptions,
      colors: colorOptions,
      sizes: sizeGroups,
      priceRanges,
    };
  } catch (error) {
    console.error("Error fetching collection filter options:", error);
    return {
      genders: [],
      brands: [],
      categories: [],
      colors: [],
      sizes: [],
      priceRanges: [],
    };
  }
}
