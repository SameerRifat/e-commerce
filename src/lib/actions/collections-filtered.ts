// src/lib/actions/collections-filtered.ts
"use server";

import { db } from "@/lib/db";
import {
  collections,
  productCollections,
  products,
  productImages,
  productVariants,
  reviews,
  brands,
  categories,
  colors,
  sizes,
  genders,
} from "@/lib/db/schema";
import { eq, and, sql, inArray, SQL, or } from "drizzle-orm";
import type { SelectCollection } from "@/lib/db/schema";
import type { NormalizedProductFilters } from "@/lib/utils/query";

export type CollectionProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  price: number | null;
  salePrice: number | null;
  discountPercentage: number | null;
  createdAt: Date;
  averageRating: number | null;
  reviewCount: number;
  productType: string;
};

export type FilteredCollectionData = {
  collection: SelectCollection;
  products: CollectionProduct[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  limit: number;
};

/**
 * Get collection products with full filtering support
 * Industry pattern: Collection-scoped filtering (Shopify, WooCommerce, Magento)
 * Filters apply WITHIN the collection context
 */
export async function getCollectionProductsWithFilters(
  slug: string,
  filters: NormalizedProductFilters
): Promise<FilteredCollectionData | null> {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 24;
    const offset = (page - 1) * limit;

    // 1. Get collection
    const [collection] = await db
      .select()
      .from(collections)
      .where(and(eq(collections.slug, slug), eq(collections.isPublished, true)))
      .limit(1);

    if (!collection) return null;

    // 2. Build filter conditions for products
    const conditions: SQL[] = [eq(products.isPublished, true)];

    // Brand filter
    if (filters.brandSlugs && filters.brandSlugs.length > 0) {
      const brandSubquery = db
        .select({ id: brands.id })
        .from(brands)
        .where(sql`LOWER(${brands.slug}) = ANY(${sql.raw(`ARRAY[${filters.brandSlugs.map(s => `'${s.toLowerCase()}'`).join(',')}]`)})`);

      conditions.push(
        inArray(
          products.brandId,
          sql`(${brandSubquery})`
        )
      );
    }

    // Category filter
    if (filters.categorySlugs && filters.categorySlugs.length > 0) {
      const categorySubquery = db
        .select({ id: categories.id })
        .from(categories)
        .where(sql`LOWER(${categories.slug}) = ANY(${sql.raw(`ARRAY[${filters.categorySlugs.map(s => `'${s.toLowerCase()}'`).join(',')}]`)})`);

      conditions.push(
        inArray(
          products.categoryId,
          sql`(${categorySubquery})`
        )
      );
    }

    // Gender filter
    if (filters.genderSlugs && filters.genderSlugs.length > 0) {
      const genderSubquery = db
        .select({ id: genders.id })
        .from(genders)
        .where(sql`LOWER(${genders.slug}) = ANY(${sql.raw(`ARRAY[${filters.genderSlugs.map(s => `'${s.toLowerCase()}'`).join(',')}]`)})`);

      conditions.push(
        inArray(
          products.genderId,
          sql`(${genderSubquery})`
        )
      );
    }

    // 3. Get all product IDs in collection that match base filters
    const baseProductIdsQuery = db
      .select({ productId: productCollections.productId })
      .from(productCollections)
      .innerJoin(products, eq(products.id, productCollections.productId))
      .where(
        and(
          eq(productCollections.collectionId, collection.id),
          ...conditions
        )
      );

    const baseProductIds = (await baseProductIdsQuery).map((p) => p.productId);

    if (baseProductIds.length === 0) {
      return {
        collection,
        products: [],
        totalCount: 0,
        hasMore: false,
        page,
        limit,
      };
    }

    // 4. Apply color filter if specified (via product variants)
    let colorFilteredIds = baseProductIds;
    if (filters.colorSlugs && filters.colorSlugs.length > 0) {
      const colorIds = await db
        .select({ id: colors.id })
        .from(colors)
        .where(inArray(colors.slug, filters.colorSlugs));

      const productIdsWithColors = await db
        .selectDistinct({ productId: productVariants.productId })
        .from(productVariants)
        .where(
          and(
            inArray(productVariants.productId, baseProductIds),
            inArray(
              productVariants.colorId,
              colorIds.map((c) => c.id)
            )
          )
        );

      colorFilteredIds = productIdsWithColors.map((p) => p.productId);

      if (colorFilteredIds.length === 0) {
        return {
          collection,
          products: [],
          totalCount: 0,
          hasMore: false,
          page,
          limit,
        };
      }
    }

    // 5. Apply size filter if specified (via product variants)
    let sizeFilteredIds = colorFilteredIds;
    if (filters.sizeSlugs && filters.sizeSlugs.length > 0) {
      const sizeIds = await db
        .select({ id: sizes.id })
        .from(sizes)
        .where(inArray(sizes.slug, filters.sizeSlugs));

      const productIdsWithSizes = await db
        .selectDistinct({ productId: productVariants.productId })
        .from(productVariants)
        .where(
          and(
            inArray(productVariants.productId, colorFilteredIds),
            inArray(
              productVariants.sizeId,
              sizeIds.map((s) => s.id)
            )
          )
        );

      sizeFilteredIds = productIdsWithSizes.map((p) => p.productId);

      if (sizeFilteredIds.length === 0) {
        return {
          collection,
          products: [],
          totalCount: 0,
          hasMore: false,
          page,
          limit,
        };
      }
    }

    // 6. Build product query with images, reviews, variants
    const imagesJoin = db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        rn: sql<number>`row_number() over (
                    partition by ${productImages.productId}
                    order by
                        case when ${productImages.variantId} is null then 0 else 1 end asc,
                        ${productImages.isPrimary} desc,
                        ${productImages.sortOrder} asc,
                        ${productImages.id} asc
                )`.as("rn"),
      })
      .from(productImages)
      .as("pi");

    const reviewsJoin = db
      .select({
        productId: reviews.productId,
        avgRating: sql<number | null>`avg(${reviews.rating})`.as("avg_rating"),
        reviewCount: sql<number>`count(${reviews.id})::int`.as("review_count"),
      })
      .from(reviews)
      .groupBy(reviews.productId)
      .as("r");

    const variantJoin = db
      .select({
        productId: productVariants.productId,
        price: sql<number>`${productVariants.price}::numeric`.as(
          "variant_price"
        ),
        salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as(
          "variant_sale_price"
        ),
        effectivePrice:
          sql<number>`COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)`.as(
            "effective_price"
          ),
      })
      .from(productVariants)
      .as("v");

    const cheapestVariantPrice = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN ${products.price}::numeric
                ELSE (
                    ARRAY_AGG(
                        ${variantJoin.price}
                        ORDER BY ${variantJoin.effectivePrice} ASC
                    ) FILTER (WHERE ${variantJoin.price} IS NOT NULL)
                )[1]
            END
        `;

    const cheapestVariantSalePrice = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN ${products.salePrice}::numeric
                ELSE (
                    ARRAY_AGG(
                        ${variantJoin.salePrice}
                        ORDER BY ${variantJoin.effectivePrice} ASC
                    ) FILTER (WHERE ${variantJoin.price} IS NOT NULL)
                )[1]
            END
        `;

    const maxDiscountAgg = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN
                    CASE
                        WHEN ${products.salePrice} IS NOT NULL AND ${products.price}::numeric > 0
                        THEN round((1 - ${products.salePrice}::numeric / ${products.price}::numeric) * 100)
                        ELSE NULL
                    END
                ELSE
                    max(
                        CASE
                            WHEN ${variantJoin.salePrice} IS NOT NULL AND ${variantJoin.price} > 0
                            THEN round((1 - ${variantJoin.salePrice} / ${variantJoin.price}) * 100)
                            ELSE NULL
                        END
                    )
            END
        `;

    const imageAgg =
      sql<string | null>`min(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
    const hoverImageAgg =
      sql<string | null>`min(case when ${imagesJoin.rn} = 2 then ${imagesJoin.url} else null end)`;

    const effectivePriceAgg = sql<number>`
            CASE
                WHEN ${products.productType} = 'simple' THEN
                    COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
                ELSE
                    min(${variantJoin.effectivePrice})
            END
        `;

    // 7. Query all filtered products (for price filtering and count)
    const allFilteredProducts = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        createdAt: products.createdAt,
        productType: products.productType,
        price: cheapestVariantPrice,
        salePrice: cheapestVariantSalePrice,
        discountPercentage: maxDiscountAgg,
        imageUrl: imageAgg,
        hoverImageUrl: hoverImageAgg,
        averageRating: reviewsJoin.avgRating,
        reviewCount: sql<number>`coalesce(${reviewsJoin.reviewCount}, 0)`,
        effectivePrice: effectivePriceAgg,
      })
      .from(products)
      .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
      .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
      .leftJoin(reviewsJoin, eq(reviewsJoin.productId, products.id))
      .where(inArray(products.id, sizeFilteredIds))
      .groupBy(
        products.id,
        products.slug,
        products.name,
        products.createdAt,
        products.productType,
        products.price,
        products.salePrice,
        reviewsJoin.avgRating,
        reviewsJoin.reviewCount
      );

    // 8. Apply price filter if specified
    let priceFilteredProducts = allFilteredProducts;
    if (filters.priceRanges && filters.priceRanges.length > 0) {
      priceFilteredProducts = allFilteredProducts.filter((p) => {
        const price = Number(p.effectivePrice);
        return filters.priceRanges!.some(([min, max]) => {
          if (min !== undefined && max !== undefined) {
            return price >= min && price <= max;
          } else if (min !== undefined) {
            return price >= min;
          } else if (max !== undefined) {
            return price <= max;
          }
          return true;
        });
      });
    }

    const totalCount = priceFilteredProducts.length;

    if (totalCount === 0) {
      return {
        collection,
        products: [],
        totalCount: 0,
        hasMore: false,
        page,
        limit,
      };
    }

    // 9. Sort products
    const sort = filters.sort || "featured";
    const sortedProducts = [...priceFilteredProducts];

    if (sort === "price_asc") {
      sortedProducts.sort(
        (a, b) => Number(a.effectivePrice) - Number(b.effectivePrice)
      );
    } else if (sort === "price_desc") {
      sortedProducts.sort(
        (a, b) => Number(b.effectivePrice) - Number(a.effectivePrice)
      );
    } else if (sort === "newest") {
      sortedProducts.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } else {
      // featured - maintain collection order
      const orderMap = new Map(
        sizeFilteredIds.map((id, index) => [id, index])
      );
      sortedProducts.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }

    // 10. Paginate
    const paginatedProducts = sortedProducts.slice(offset, offset + limit);

    // 11. Format results
    const formattedProducts: CollectionProduct[] = paginatedProducts.map(
      (p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        imageUrl: p.imageUrl,
        hoverImageUrl: p.hoverImageUrl,
        price: p.price === null ? null : Number(p.price),
        salePrice: p.salePrice === null ? null : Number(p.salePrice),
        discountPercentage:
          p.discountPercentage === null ? null : Number(p.discountPercentage),
        createdAt: p.createdAt,
        averageRating: p.averageRating ? Number(p.averageRating) : null,
        reviewCount: Number(p.reviewCount),
        productType: p.productType,
      })
    );

    return {
      collection,
      products: formattedProducts,
      totalCount,
      hasMore: offset + limit < totalCount,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching filtered collection products:", error);
    return null;
  }
}
