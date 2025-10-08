// src/lib/actions/product.ts (Enhanced version)
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
  users,
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
  name: string;
  imageUrl: string | null;
  hoverImageUrl: string | null;
  price: number | null;           // Original price (min across variants)
  salePrice: number | null;       // Sale price (min across variants)
  discountPercentage: number | null; // Maximum discount percentage
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

  // Gender filter
  if (filters?.genderSlugs?.length) {
    conds.push(inArray(genders.slug, filters.genderSlugs));
  }

  // Brand filter
  if (filters?.brandSlugs?.length) {
    conds.push(inArray(brands.slug, filters.brandSlugs));
  }

  // Category filter
  if (filters?.categorySlugs?.length) {
    conds.push(inArray(categories.slug, filters.categorySlugs));
  }

  const hasSize = (filters?.sizeSlugs?.length ?? 0) > 0;
  const hasColor = (filters?.colorSlugs?.length ?? 0) > 0;
  const hasPrice = !!(filters?.priceMin !== undefined || filters?.priceMax !== undefined || filters?.priceRanges?.length);

  // Build variant conditions (size, color, price)
  const variantConds: SQL[] = [];

  // Size filter - fetch IDs first
  if (hasSize) {
    const sizeIds = await db
      .select({ id: sizes.id })
      .from(sizes)
      .where(inArray(sizes.slug, filters.sizeSlugs!));

    if (sizeIds.length > 0) {
      variantConds.push(inArray(productVariants.sizeId, sizeIds.map(s => s.id)));
    } else {
      variantConds.push(sql`false`);
    }
  }

  // Color filter - fetch IDs first
  if (hasColor) {
    const colorIds = await db
      .select({ id: colors.id })
      .from(colors)
      .where(inArray(colors.slug, filters.colorSlugs!));

    if (colorIds.length > 0) {
      variantConds.push(inArray(productVariants.colorId, colorIds.map(c => c.id)));
    } else {
      variantConds.push(sql`false`);
    }
  }

  // Price filter - check both regular price and sale price
  if (hasPrice) {
    const priceBounds: SQL[] = [];

    if (filters?.priceRanges?.length) {
      for (const [min, max] of filters.priceRanges) {
        const subConds: SQL[] = [];
        if (min !== undefined) {
          subConds.push(sql`(COALESCE(${productVariants.salePrice}, ${productVariants.price}))::numeric >= ${min}`);
        }
        if (max !== undefined) {
          subConds.push(sql`(COALESCE(${productVariants.salePrice}, ${productVariants.price}))::numeric <= ${max}`);
        }
        if (subConds.length) priceBounds.push(and(...subConds)!);
      }
    }

    if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
      const subConds: SQL[] = [];
      if (filters?.priceMin !== undefined) {
        subConds.push(sql`(COALESCE(${productVariants.salePrice}, ${productVariants.price}))::numeric >= ${filters.priceMin}`);
      }
      if (filters?.priceMax !== undefined) {
        subConds.push(sql`(COALESCE(${productVariants.salePrice}, ${productVariants.price}))::numeric <= ${filters.priceMax}`);
      }
      if (subConds.length) priceBounds.push(and(...subConds)!);
    }

    if (priceBounds.length) {
      variantConds.push(or(...priceBounds)!);
    }
  }

  const needsVariantFilter = variantConds.length > 0;

  // Build variant subquery
  const variantJoin = db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("variant_price"),
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as("variant_sale_price"),
      colorId: productVariants.colorId,
      sizeId: productVariants.sizeId,
    })
    .from(productVariants)
    .where(variantConds.length ? and(...variantConds) : undefined)
    .as("v");

  // Image selection with row numbering to get first 2 images
  const imagesJoin = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (
        partition by ${productImages.productId}
        order by 
          case when ${productImages.variantId} is null then 0 else 1 end asc,
          ${productImages.isPrimary} desc,
          ${productImages.sortOrder} asc
      )`.as("rn"),
    })
    .from(productImages)
    .as("pi");

  // Reviews aggregation subquery
  const reviewsJoin = db
    .select({
      productId: reviews.productId,
      avgRating: sql<number | null>`avg(${reviews.rating})`.as("avg_rating"),
      reviewCount: sql<number>`count(${reviews.id})::int`.as("review_count"),
    })
    .from(reviews)
    .groupBy(reviews.productId)
    .as("r");

  const baseWhere = conds.length ? and(...conds) : undefined;

  // Price aggregations - get min of both regular and sale prices
  const minPriceAgg = sql<number | null>`min(coalesce(${variantJoin.price}, ${products.price}::numeric))`;
  const minSalePriceAgg = sql<number | null>`min(coalesce(${variantJoin.salePrice}, ${products.salePrice}::numeric))`;
  
  // Calculate maximum discount percentage across all variants
  // For each variant: if sale_price exists, calculate (1 - sale_price/price) * 100
  // Then take the maximum discount
  const maxDiscountAgg = sql<number | null>`
    max(
      case 
        when coalesce(${variantJoin.salePrice}, ${products.salePrice}::numeric) is not null 
          and coalesce(${variantJoin.price}, ${products.price}::numeric) > 0
        then round((1 - coalesce(${variantJoin.salePrice}, ${products.salePrice}::numeric) / coalesce(${variantJoin.price}, ${products.price}::numeric)) * 100)
        else null 
      end
    )
  `;

  // Aggregate first and second images
  const imageAgg = sql<string | null>`max(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
  const hoverImageAgg = sql<string | null>`max(case when ${imagesJoin.rn} = 2 then ${imagesJoin.url} else null end)`;

  // Sorting logic - use effective price (sale price if available, otherwise regular price)
  const effectivePriceAgg = sql`min(coalesce(
    coalesce(${variantJoin.salePrice}, ${products.salePrice}::numeric),
    coalesce(${variantJoin.price}, ${products.price}::numeric)
  ))`;

  const primaryOrder =
    filters?.sort === "price_asc"
      ? asc(effectivePriceAgg)
      : filters?.sort === "price_desc"
        ? desc(effectivePriceAgg)
        : desc(products.createdAt);

  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.max(1, Math.min(filters?.limit ?? 24, 60));
  const offset = (page - 1) * limit;

  // Build main query
  const buildQuery = () => {
    const baseQuery = db
      .select({
        id: products.id,
        name: products.name,
        createdAt: products.createdAt,
        price: minPriceAgg,
        salePrice: minSalePriceAgg,
        discountPercentage: maxDiscountAgg,
        imageUrl: imageAgg,
        hoverImageUrl: hoverImageAgg,
        averageRating: reviewsJoin.avgRating,
        reviewCount: sql<number>`coalesce(${reviewsJoin.reviewCount}, 0)`,
      })
      .from(products);

    const withVariantJoin = needsVariantFilter
      ? baseQuery.innerJoin(variantJoin, eq(variantJoin.productId, products.id))
      : baseQuery.leftJoin(variantJoin, eq(variantJoin.productId, products.id));

    return withVariantJoin
      .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
      .leftJoin(reviewsJoin, eq(reviewsJoin.productId, products.id))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(baseWhere)
      .groupBy(products.id, products.name, products.createdAt, reviewsJoin.avgRating, reviewsJoin.reviewCount)
      .orderBy(primaryOrder, desc(products.createdAt), asc(products.id));
  };

  // Execute main query with pagination
  const rows = await buildQuery()
    .limit(limit)
    .offset(offset);

  // Count query
  const countQuery = () => {
    const baseQuery = db
      .select({
        cnt: count(sql<number>`distinct ${products.id}`),
      })
      .from(products);

    const withVariantJoin = needsVariantFilter
      ? baseQuery.innerJoin(variantJoin, eq(variantJoin.productId, products.id))
      : baseQuery.leftJoin(variantJoin, eq(variantJoin.productId, products.id));

    return withVariantJoin
      .leftJoin(genders, eq(genders.id, products.genderId))
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(baseWhere);
  };

  const countRows = await countQuery();

  const productsOut: ProductListItem[] = rows.map((r) => ({
    id: r.id,
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

  const totalCount = countRows[0]?.cnt ?? 0;

  return { products: productsOut, totalCount };
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

export async function getProduct(productId: string): Promise<FullProduct | null> {
  // Single optimized query with all necessary joins
  const rows = await db
    .select({
      // Product fields
      productId: products.id,
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
  title: string;
  price: number | null;
  imageUrl: string;
};

export async function getRecommendedProducts(productId: string): Promise<RecommendedProduct[]> {
  const base = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];
  const b = base[0];

  const v = db
    .select({
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("variant_price"),
    })
    .from(productVariants)
    .as("v");

  const pi = db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
        "rn",
      ),
    })
    .from(productImages)
    .as("pi");

  const priority = sql<number>`
    (case when ${products.categoryId} is not null and ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} is not null and ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} is not null and ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  const rows = await db
    .select({
      id: products.id,
      title: products.name,
      minPrice: sql<number | null>`min(${v.price})`,
      imageUrl: sql<string | null>`max(case when ${pi.rn} = 1 then ${pi.url} else null end)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(v, eq(v.productId, products.id))
    .leftJoin(pi, eq(pi.productId, products.id))
    .where(and(eq(products.isPublished, true), sql`${products.id} <> ${productId}`))
    .groupBy(products.id, products.name, products.createdAt)
    .orderBy(
      desc(priority),
      desc(products.createdAt),
      asc(products.id)
    )
    .limit(8);

  const out: RecommendedProduct[] = [];
  for (const r of rows) {
    const img = r.imageUrl?.trim();
    if (!img) continue;
    out.push({
      id: r.id,
      title: r.title,
      price: r.minPrice === null ? null : Number(r.minPrice),
      imageUrl: img,
    });
    if (out.length >= 6) break;
  }
  return out;
}