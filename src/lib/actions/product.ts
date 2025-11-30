// src/lib/actions/product.ts (Optimized version)
/**
 * E-commerce Product Filtering - Optimized Queries
 *
 * Industry Pattern: Direct JOINs instead of subqueries for better performance
 * - Uses indexes on join columns (WooCommerce pattern)
 * - Filters before joining when possible (Query optimization best practice)
 * - Simplified WHERE conditions for better query planner usage
 *
 * References:
 * - https://whitelabelcoders.com/blog/what-is-database-query-optimization-and-why-is-it-important-to-scale-my-woocommerce-store/
 * - https://www.acceldata.io/blog/query-optimization-in-sql-essential-techniques-tools-and-best-practices
 * - https://developer.woocommerce.com/2022/02/02/new-product-filtering-by-attributes-rolling-out-in-woocommerce-6-3/
 */
"use server";

import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
  sizes,
  colors,
  reviews,
  type SelectProduct,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
} from "@/lib/db/schema";

import { NormalizedProductFilters } from "@/lib/utils/query";

type ProductListItem = {
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
};

export type GetAllProductsResult = {
  products: ProductListItem[];
  totalCount: number;
};

export async function getAllProducts(filters: NormalizedProductFilters): Promise<GetAllProductsResult> {
  const conds: SQL[] = [eq(products.isPublished, true)];

  // Search condition
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conds.push(or(ilike(products.name, pattern), ilike(products.description, pattern))!);
  }

  // ===== SIMPLIFIED: Direct filter conditions instead of subqueries =====
  // Gender filter - direct condition, will be joined later
  const hasGenderFilter = filters?.genderSlugs?.length;
  const hasBrandFilter = filters?.brandSlugs?.length;
  const hasCategoryFilter = filters?.categorySlugs?.length;
  const hasSizeFilter = filters?.sizeSlugs?.length;
  const hasColorFilter = filters?.colorSlugs?.length;

  // Check if we need variant filtering
  const needsVariantFilter = hasSizeFilter || hasColorFilter;
  const hasPrice = !!(filters?.priceMin !== undefined || filters?.priceMax !== undefined || filters?.priceRanges?.length);

  // Build variant conditions for size/color filtering
  const variantConds: SQL[] = [];
  if (needsVariantFilter) {
    if (hasSizeFilter) {
      variantConds.push(inArray(productVariants.sizeId,
        db.select({ id: sizes.id }).from(sizes).where(inArray(sizes.slug, filters.sizeSlugs!))
      ));
    }
    if (hasColorFilter) {
      variantConds.push(inArray(productVariants.colorId,
        db.select({ id: colors.id }).from(colors).where(inArray(colors.slug, filters.colorSlugs!))
      ));
    }
  }

  // Variant join (only when needed for filtering)
  const variantJoin = db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("variant_price"),
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as("variant_sale_price"),
      effectivePrice: sql<number>`COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)`.as("effective_price"),
    })
    .from(productVariants)
    .where(variantConds.length ? and(...variantConds) : undefined)
    .as("v");

  // Build price conditions
  const priceConditions: SQL[] = [];

  if (hasPrice) {
    // Process price ranges
    if (filters?.priceRanges?.length) {
      for (const [min, max] of filters.priceRanges) {
        const rangeConditions: SQL[] = [];

        // Simple products
        const simpleCondition: SQL[] = [eq(products.productType, 'simple')];
        if (min !== undefined)
          simpleCondition.push(sql`COALESCE(${products.salePrice}::numeric, ${products.price}::numeric) >= ${min}`);
        if (max !== undefined)
          simpleCondition.push(sql`COALESCE(${products.salePrice}::numeric, ${products.price}::numeric) <= ${max}`);
        rangeConditions.push(and(...simpleCondition)!);

        // Configurable products
        const configurableCondition: SQL[] = [
          eq(products.productType, 'configurable'),
          sql`${variantJoin.variantId} IS NOT NULL`
        ];
        if (min !== undefined)
          configurableCondition.push(sql`${variantJoin.effectivePrice} >= ${min}`);
        if (max !== undefined)
          configurableCondition.push(sql`${variantJoin.effectivePrice} <= ${max}`);
        rangeConditions.push(and(...configurableCondition)!);

        priceConditions.push(or(...rangeConditions)!);
      }
    }

    // Process min/max price
    if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
      const rangeConditions: SQL[] = [];

      const simpleCondition: SQL[] = [eq(products.productType, 'simple')];
      if (filters?.priceMin !== undefined)
        simpleCondition.push(sql`COALESCE(${products.salePrice}::numeric, ${products.price}::numeric) >= ${filters.priceMin}`);
      if (filters?.priceMax !== undefined)
        simpleCondition.push(sql`COALESCE(${products.salePrice}::numeric, ${products.price}::numeric) <= ${filters.priceMax}`);
      rangeConditions.push(and(...simpleCondition)!);

      const configurableCondition: SQL[] = [
        eq(products.productType, 'configurable'),
        sql`${variantJoin.variantId} IS NOT NULL`
      ];
      if (filters?.priceMin !== undefined)
        configurableCondition.push(sql`${variantJoin.effectivePrice} >= ${filters.priceMin}`);
      if (filters?.priceMax !== undefined)
        configurableCondition.push(sql`${variantJoin.effectivePrice} <= ${filters.priceMax}`);
      rangeConditions.push(and(...configurableCondition)!);

      priceConditions.push(or(...rangeConditions)!);
    }
  }

  // Images join
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

  // Reviews join
  const reviewsJoin = db
    .select({
      productId: reviews.productId,
      avgRating: sql<number | null>`avg(${reviews.rating})`.as("avg_rating"),
      reviewCount: sql<number>`count(${reviews.id})::int`.as("review_count"),
    })
    .from(reviews)
    .groupBy(reviews.productId)
    .as("r");

  // ===== SIMPLIFIED: Price aggregations with simpler logic =====
  const cheapestVariantPrice = sql<number | null>`
    CASE
      WHEN ${products.productType} = 'simple' THEN ${products.price}::numeric
      ELSE (
        ARRAY_AGG(
          ${variantJoin.price}
          ORDER BY ${variantJoin.effectivePrice} ASC, ${variantJoin.variantId} ASC
        ) FILTER (WHERE ${variantJoin.variantId} IS NOT NULL)
      )[1]
    END
  `;

  const cheapestVariantSalePrice = sql<number | null>`
    CASE
      WHEN ${products.productType} = 'simple' THEN ${products.salePrice}::numeric
      ELSE (
        ARRAY_AGG(
          ${variantJoin.salePrice}
          ORDER BY ${variantJoin.effectivePrice} ASC, ${variantJoin.variantId} ASC
        ) FILTER (WHERE ${variantJoin.variantId} IS NOT NULL)
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

  const imageAgg = sql<string | null>`min(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
  const hoverImageAgg = sql<string | null>`min(case when ${imagesJoin.rn} = 2 then ${imagesJoin.url} else null end)`;

  const effectivePriceAgg = sql`
    CASE
      WHEN ${products.productType} = 'simple' THEN
        COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
      ELSE
        min(${variantJoin.effectivePrice})
    END
  `;

  // Sorting
  const SORT_MAPPINGS = {
    price_asc: [asc(effectivePriceAgg), desc(products.createdAt), asc(products.id)],
    price_desc: [desc(effectivePriceAgg), desc(products.createdAt), asc(products.id)],
    newest: [desc(products.createdAt), asc(products.id)],
    featured: [desc(products.createdAt), asc(products.id)],
  } as const;

  const sortKey = filters?.sort || 'newest';
  const primaryOrder = SORT_MAPPINGS[sortKey] || SORT_MAPPINGS.newest;

  // Pagination
  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.max(1, Math.min(filters?.limit ?? 24, 60));
  const offset = (page - 1) * limit;

  // Build the query with optimized joins
  const buildQuery = () => {
    let query = db
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
      })
      .from(products);

    // ===== SIMPLIFIED: Conditional joins based on filters (industry best practice) =====
    // Only join tables that are actually needed for filtering
    if (hasGenderFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(genders, eq(products.genderId, genders.id)) as any; // Drizzle ORM type limitation
      conds.push(inArray(genders.slug, filters.genderSlugs!));
    }

    if (hasBrandFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(brands, eq(products.brandId, brands.id)) as any; // Drizzle ORM type limitation
      conds.push(inArray(brands.slug, filters.brandSlugs!));
    }

    if (hasCategoryFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(categories, eq(products.categoryId, categories.id)) as any; // Drizzle ORM type limitation
      conds.push(inArray(categories.slug, filters.categorySlugs!));
    }

    // Variant join (for size/color/price filtering)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.leftJoin(variantJoin, eq(variantJoin.productId, products.id)) as any; // Drizzle ORM type limitation

    // ===== SIMPLIFIED: Cleaner WHERE conditions =====
    const allConditions: SQL[] = [...conds];

    // Variant filter logic
    if (needsVariantFilter) {
      // Size/color filters only apply to configurable products with matching variants
      allConditions.push(
        and(
          eq(products.productType, 'configurable'),
          sql`${variantJoin.variantId} IS NOT NULL`
        )!
      );
    } else if (hasPrice) {
      // Price filters include both simple and configurable products
      allConditions.push(
        or(
          eq(products.productType, 'simple'),
          sql`${variantJoin.variantId} IS NOT NULL`
        )!
      );
    }

    if (priceConditions.length > 0) {
      allConditions.push(or(...priceConditions)!);
    }

    return query
      .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
      .leftJoin(reviewsJoin, eq(reviewsJoin.productId, products.id))
      .where(allConditions.length > 0 ? and(...allConditions) : undefined)
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
      )
      .orderBy(...primaryOrder);
  };

  // Execute query
  const rows = await buildQuery().limit(limit).offset(offset);

  // Count query with same filtering logic
  const countQuery = () => {
    let query = db
      .select({ cnt: count(sql`distinct ${products.id}`) })
      .from(products);

    // Apply same conditional joins
    if (hasGenderFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(genders, eq(products.genderId, genders.id)) as any; // Drizzle ORM type limitation
    }

    if (hasBrandFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(brands, eq(products.brandId, brands.id)) as any; // Drizzle ORM type limitation
    }

    if (hasCategoryFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.innerJoin(categories, eq(products.categoryId, categories.id)) as any; // Drizzle ORM type limitation
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.leftJoin(variantJoin, eq(variantJoin.productId, products.id)) as any; // Drizzle ORM type limitation

    const allConditions: SQL[] = [...conds];

    if (needsVariantFilter) {
      allConditions.push(
        and(
          eq(products.productType, 'configurable'),
          sql`${variantJoin.variantId} IS NOT NULL`
        )!
      );
    } else if (hasPrice) {
      allConditions.push(
        or(
          eq(products.productType, 'simple'),
          sql`${variantJoin.variantId} IS NOT NULL`
        )!
      );
    }

    if (priceConditions.length > 0) {
      allConditions.push(or(...priceConditions)!);
    }

    return query.where(allConditions.length > 0 ? and(...allConditions) : undefined);
  };

  const countRows = await countQuery();

  // Map results
  const productsOut: ProductListItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    imageUrl: r.imageUrl,
    hoverImageUrl: r.hoverImageUrl,
    price: r.price === null ? null : Number(r.price),
    salePrice: r.salePrice === null ? null : Number(r.salePrice),
    discountPercentage: r.discountPercentage === null ? null : Number(r.discountPercentage),
    createdAt: r.createdAt,
    averageRating: r.averageRating ? Number(r.averageRating) : null,
    reviewCount: Number(r.reviewCount),
  }));

  return {
    products: productsOut,
    totalCount: countRows[0]?.cnt ?? 0,
  };
}

// Keep remaining functions unchanged (getProductBySlug, etc.)
export async function fetchMoreProducts(
  filters: NormalizedProductFilters,
  nextPage: number
): Promise<GetAllProductsResult> {
  if (nextPage < 1) {
    throw new Error("Invalid page number");
  }

  return getAllProducts({
    ...filters,
    page: nextPage,
  });
}

export type FullProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
    productType: 'simple' | 'configurable';
    price?: string | null;
    salePrice?: string | null;
    sku?: string | null;
    inStock?: number | null;
    weight?: number | null;
    dimensions?: unknown | null;
  };
  variants: Array<{
    id: string;
    productId: string;
    sku: string;
    price: string;
    salePrice?: string | null;
    colorId?: string | null;
    sizeId?: string | null;
    inStock: number;
    weight?: number | null;
    dimensions?: unknown | null;
    createdAt: Date;
    color?: SelectColor | null;
    size?: SelectSize | null;
  }>;
  images: SelectProductImage[];
};

/**
 * Get product by slug with all related data (variants, images, brand, category, gender)
 * Primary method for product detail pages
 */
export async function getProductBySlug(slug: string): Promise<FullProduct | null> {
  // Single optimized query with all necessary joins
  const rows = await db
    .select({
      // Product fields
      productId: products.id,
      productSlug: products.slug,
      productName: products.name,
      productDescription: products.description,
      productBrandId: products.brandId,
      productCategoryId: products.categoryId,
      productGenderId: products.genderId,
      productType: products.productType,
      productPrice: sql<number | null>`${products.price}::numeric`,
      productSalePrice: sql<number | null>`${products.salePrice}::numeric`,
      productSku: products.sku,
      productInStock: products.inStock,
      productWeight: products.weight,
      productDimensions: products.dimensions,
      isPublished: products.isPublished,
      defaultVariantId: products.defaultVariantId,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,

      // Brand fields
      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandLogoUrl: brands.logoUrl,

      // Category fields
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,

      // Gender fields
      genderId: genders.id,
      genderLabel: genders.label,
      genderSlug: genders.slug,

      // Variant fields (for configurable products)
      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: sql<number | null>`${productVariants.price}::numeric`,
      variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      variantColorId: productVariants.colorId,
      variantSizeId: productVariants.sizeId,
      variantInStock: sql<number>`COALESCE(${productVariants.inStock}, 0)`,
      variantWeight: productVariants.weight,
      variantDimensions: productVariants.dimensions,
      variantCreatedAt: productVariants.createdAt,

      // Color fields
      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,

      // Size fields
      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sizeSortOrder: sizes.sortOrder,

      // Image fields
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsPrimary: productImages.isPrimary,
      imageSortOrder: productImages.sortOrder,
      imageVariantId: productImages.variantId,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.slug, slug))
    .orderBy(
      asc(productVariants.sku),
      asc(productImages.sortOrder),
      desc(productImages.isPrimary)
    );

  if (!rows.length) return null;

  const head = rows[0];

  // Build the product object with proper type handling
  const product: FullProduct['product'] = {
    id: head.productId,
    slug: head.productSlug,
    name: head.productName,
    description: head.productDescription,
    brandId: head.productBrandId ?? null,
    categoryId: head.productCategoryId ?? null,
    genderId: head.productGenderId ?? null,
    productType: (head.productType as 'simple' | 'configurable') || 'simple',
    price: head.productPrice !== null ? String(head.productPrice) : null,
    salePrice: head.productSalePrice !== null ? String(head.productSalePrice) : null,
    sku: head.productSku,
    inStock: head.productInStock,
    weight: head.productWeight,
    dimensions: head.productDimensions as unknown as { length?: number | undefined; width?: number | undefined; height?: number | undefined } | null | undefined,
    isPublished: head.isPublished,
    defaultVariantId: head.defaultVariantId ?? null,
    createdAt: head.productCreatedAt,
    updatedAt: head.productUpdatedAt,
    brand: head.brandId
      ? {
        id: head.brandId,
        name: head.brandName!,
        slug: head.brandSlug!,
        logoUrl: head.brandLogoUrl ?? null,
      }
      : null,
    category: head.categoryId
      ? {
        id: head.categoryId,
        name: head.categoryName!,
        slug: head.categorySlug!,
        parentId: null,
      }
      : null,
    gender: head.genderId
      ? {
        id: head.genderId,
        label: head.genderLabel!,
        slug: head.genderSlug!,
      }
      : null,
  };

  // Build variants map (only for configurable products)
  const variantsMap = new Map<string, FullProduct["variants"][number]>();
  const imagesMap = new Map<string, SelectProductImage>();

  for (const row of rows) {
    // Process variants (only for configurable products)
    if (product.productType === 'configurable' && row.variantId && !variantsMap.has(row.variantId)) {
      variantsMap.set(row.variantId, {
        id: row.variantId,
        productId: head.productId,
        sku: row.variantSku!,
        price: row.variantPrice !== null ? String(row.variantPrice) : "0",
        salePrice: row.variantSalePrice !== null ? String(row.variantSalePrice) : null,
        colorId: row.variantColorId!,
        sizeId: row.variantSizeId!,
        inStock: row.variantInStock,
        weight: row.variantWeight,
        dimensions: row.variantDimensions as unknown,
        createdAt: row.variantCreatedAt!,
        color: row.colorId
          ? {
            id: row.colorId,
            name: row.colorName!,
            slug: row.colorSlug!,
            hexCode: row.colorHex!,
          }
          : null,
        size: row.sizeId
          ? {
            id: row.sizeId,
            name: row.sizeName!,
            slug: row.sizeSlug!,
            sortOrder: row.sizeSortOrder!,
          }
          : null,
      });
    }

    // Process images
    if (row.imageId && !imagesMap.has(row.imageId)) {
      imagesMap.set(row.imageId, {
        id: row.imageId,
        productId: head.productId,
        variantId: row.imageVariantId ?? null,
        url: row.imageUrl!,
        sortOrder: row.imageSortOrder ?? 0,
        isPrimary: row.imageIsPrimary ?? false,
      });
    }
  }

  return {
    product,
    variants: Array.from(variantsMap.values()),
    images: Array.from(imagesMap.values()),
  };
}

export async function getProduct(productId: string): Promise<FullProduct | null> {
  // Single optimized query with all necessary joins
  const rows = await db
    .select({
      // Product fields
      productId: products.id,
      productName: products.name,
      productSlug: products.slug,
      productDescription: products.description,
      productBrandId: products.brandId,
      productCategoryId: products.categoryId,
      productGenderId: products.genderId,
      productType: products.productType,
      productPrice: sql<number | null>`${products.price}::numeric`,
      productSalePrice: sql<number | null>`${products.salePrice}::numeric`,
      productSku: products.sku,
      productInStock: products.inStock,
      productWeight: products.weight,
      productDimensions: products.dimensions,
      isPublished: products.isPublished,
      defaultVariantId: products.defaultVariantId,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,

      // Brand fields
      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandLogoUrl: brands.logoUrl,

      // Category fields
      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,

      // Gender fields
      genderId: genders.id,
      genderLabel: genders.label,
      genderSlug: genders.slug,

      // Variant fields (for configurable products)
      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: sql<number | null>`${productVariants.price}::numeric`,
      variantSalePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      variantColorId: productVariants.colorId,
      variantSizeId: productVariants.sizeId,
      variantInStock: sql<number>`COALESCE(${productVariants.inStock}, 0)`,
      variantWeight: productVariants.weight,
      variantDimensions: productVariants.dimensions,
      variantCreatedAt: productVariants.createdAt,

      // Color fields
      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,

      // Size fields
      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sizeSortOrder: sizes.sortOrder,

      // Image fields
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsPrimary: productImages.isPrimary,
      imageSortOrder: productImages.sortOrder,
      imageVariantId: productImages.variantId,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.id, productId))
    .orderBy(
      asc(productVariants.sku), 
      asc(productImages.sortOrder), 
      desc(productImages.isPrimary)
    );

  if (!rows.length) return null;

  const head = rows[0];
  
  // Build the product object with proper type handling
  const product: FullProduct['product'] = {
    id: head.productId,
    name: head.productName,
    slug: head.productSlug,
    description: head.productDescription,
    brandId: head.productBrandId ?? null,
    categoryId: head.productCategoryId ?? null,
    genderId: head.productGenderId ?? null,
    productType: (head.productType as 'simple' | 'configurable') || 'simple',
    price: head.productPrice !== null ? String(head.productPrice) : null,
    salePrice: head.productSalePrice !== null ? String(head.productSalePrice) : null,
    sku: head.productSku,
    inStock: head.productInStock,
    weight: head.productWeight,
    dimensions: head.productDimensions as unknown as { length?: number | undefined; width?: number | undefined; height?: number | undefined } | null | undefined,
    isPublished: head.isPublished,
    defaultVariantId: head.defaultVariantId ?? null,
    createdAt: head.productCreatedAt,
    updatedAt: head.productUpdatedAt,
    brand: head.brandId
      ? {
        id: head.brandId,
        name: head.brandName!,
        slug: head.brandSlug!,
        logoUrl: head.brandLogoUrl ?? null,
      }
      : null,
    category: head.categoryId
      ? {
        id: head.categoryId,
        name: head.categoryName!,
        slug: head.categorySlug!,
        parentId: null,
      }
      : null,
    gender: head.genderId
      ? {
        id: head.genderId,
        label: head.genderLabel!,
        slug: head.genderSlug!,
      }
      : null,
  };

  // Build variants map (only for configurable products)
  const variantsMap = new Map<string, FullProduct["variants"][number]>();
  const imagesMap = new Map<string, SelectProductImage>();

  for (const row of rows) {
    // Process variants (only for configurable products)
    if (product.productType === 'configurable' && row.variantId && !variantsMap.has(row.variantId)) {
      variantsMap.set(row.variantId, {
        id: row.variantId,
        productId: head.productId,
        sku: row.variantSku!,
        price: row.variantPrice !== null ? String(row.variantPrice) : "0",
        salePrice: row.variantSalePrice !== null ? String(row.variantSalePrice) : null,
        colorId: row.variantColorId!,
        sizeId: row.variantSizeId!,
        inStock: row.variantInStock,
        weight: row.variantWeight,
        dimensions: row.variantDimensions as unknown,
        createdAt: row.variantCreatedAt!,
        color: row.colorId
          ? {
            id: row.colorId,
            name: row.colorName!,
            slug: row.colorSlug!,
            hexCode: row.colorHex!,
          }
          : null,
        size: row.sizeId
          ? {
            id: row.sizeId,
            name: row.sizeName!,
            slug: row.sizeSlug!,
            sortOrder: row.sizeSortOrder!,
          }
          : null,
      });
    }
    
    // Process images
    if (row.imageId && !imagesMap.has(row.imageId)) {
      imagesMap.set(row.imageId, {
        id: row.imageId,
        productId: head.productId,
        variantId: row.imageVariantId ?? null,
        url: row.imageUrl!,
        sortOrder: row.imageSortOrder ?? 0,
        isPrimary: row.imageIsPrimary ?? false,
      });
    }
  }

  return {
    product,
    variants: Array.from(variantsMap.values()),
    images: Array.from(imagesMap.values()),
  };
}


export type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

export async function getProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    author: r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export type RecommendedProduct = {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  salePrice: number | null;
  discountPercentage: number | null;
  imageUrl: string;
  hoverImageUrl: string | null;
  averageRating: number | null;
  reviewCount: number;
};

export async function getRecommendedProducts(productId: string): Promise<RecommendedProduct[]> {
  // Get base product for priority matching
  const base = await db
    .select({
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];

  const b = base[0];

  // STEP 1: Create a subquery for ranked images (window function)
  const rankedImages = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (
        partition by ${productImages.productId} 
        order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc
      )`.as('rn'),
    })
    .from(productImages)
    .as('ranked_images');

  // Define priority calculation expression (reusable)
  const priorityExpr = sql<number>`
    (case when ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  // STEP 2: Main query with aggregations (no window functions here)
  const rows = await db
    .select({
      id: products.id,
      slug: products.slug,
      name: products.name,
      // Price aggregation
      minPrice: sql<number | null>`min(coalesce(${productVariants.price}, ${products.price}::numeric))`,
      minSalePrice: sql<number | null>`min(coalesce(${productVariants.salePrice}, ${products.salePrice}::numeric))`,
      // Discount calculation
      maxDiscount: sql<number | null>`max(
        case 
          when coalesce(${productVariants.salePrice}, ${products.salePrice}::numeric) is not null 
            and coalesce(${productVariants.price}, ${products.price}::numeric) > 0
          then round((1 - coalesce(${productVariants.salePrice}, ${products.salePrice}::numeric) / coalesce(${productVariants.price}, ${products.price}::numeric)) * 100)
          else null 
        end
      )`,
      // Image aggregation from ranked subquery
      primaryImage: sql<string | null>`max(case when ${rankedImages.rn} = 1 then ${rankedImages.url} else null end)`,
      hoverImage: sql<string | null>`max(case when ${rankedImages.rn} = 2 then ${rankedImages.url} else null end)`,
      // Review aggregation
      avgRating: sql<number | null>`avg(${reviews.rating})`,
      reviewCount: sql<number>`coalesce(count(distinct ${reviews.id}), 0)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(rankedImages, eq(rankedImages.productId, products.id))
    .leftJoin(reviews, eq(reviews.productId, products.id))
    .where(and(
      eq(products.isPublished, true),
      sql`${products.id} <> ${productId}`
    ))
    .groupBy(products.id, products.slug, products.name, products.createdAt)
    .orderBy(
      desc(priorityExpr), // Use the raw expression, not an alias
      desc(products.createdAt),
      asc(products.id)
    )
    .limit(8);

  // Transform and filter results
  const results: RecommendedProduct[] = [];
  for (const row of rows) {
    const imageUrl = row.primaryImage?.trim();
    if (!imageUrl) continue;

    results.push({
      id: row.id,
      slug: row.slug,
      title: row.name,
      price: row.minPrice ? Number(row.minPrice) : null,
      salePrice: row.minSalePrice ? Number(row.minSalePrice) : null,
      discountPercentage: row.maxDiscount ? Number(row.maxDiscount) : null,
      imageUrl,
      hoverImageUrl: row.hoverImage?.trim() || null,
      averageRating: row.avgRating ? Number(row.avgRating) : null,
      reviewCount: Number(row.reviewCount),
    });

    if (results.length >= 6) break;
  }

  return results;
}