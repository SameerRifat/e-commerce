// src/lib/actions/dashboard-products.ts
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
  colors,
  sizes,
  type SelectProduct,
  type SelectVariant,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
} from "@/lib/db/schema";
import type {
  DashboardProductListItem,
  DashboardProductFilters,
  DashboardProductsResponse,
  DashboardFilterOptions,
  ActionResult,
  BrandListItem,
  CategoryListItem,
} from "@/types/dashboard";

export async function getDashboardProducts(filters: DashboardProductFilters): Promise<DashboardProductsResponse> {
  const conds: SQL[] = [];

  // Search functionality
  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conds.push(
      or(
        ilike(products.name, pattern),
        ilike(products.description, pattern),
        ilike(brands.name, pattern)
      )!
    );
  }

  // Status filter
  if (filters.status === "published") {
    conds.push(eq(products.isPublished, true));
  } else if (filters.status === "draft") {
    conds.push(eq(products.isPublished, false));
  }

  // Category filter
  if (filters.category && filters.category !== "all") {
    conds.push(eq(categories.slug, filters.category));
  }

  // Brand filter
  if (filters.brand && filters.brand !== "all") {
    conds.push(eq(brands.slug, filters.brand));
  }

  // Product type filter
  if (filters.productType && filters.productType !== "all") {
    conds.push(eq(products.productType, filters.productType));
  }

  const baseWhere = conds.length ? and(...conds) : undefined;

  // Pagination
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.max(1, Math.min(filters.limit ?? 24, 100));
  const offset = (page - 1) * limit;

  // Sorting
  let orderBy;
  switch (filters.sort) {
    case "name_asc":
      orderBy = asc(products.name);
      break;
    case "name_desc":
      orderBy = desc(products.name);
      break;
    case "created_asc":
      orderBy = asc(products.createdAt);
      break;
    case "created_desc":
      orderBy = desc(products.createdAt);
      break;
    case "updated_asc":
      orderBy = asc(products.updatedAt);
      break;
    case "updated_desc":
      orderBy = desc(products.updatedAt);
      break;
    default:
      orderBy = desc(products.updatedAt);
  }

  // Direct query with proper aliasing to avoid subquery issues
  const productRows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productType: products.productType,
      isPublished: products.isPublished,
      productPrice: products.price,
      productSalePrice: products.salePrice,
      productSku: products.sku,
      productInStock: products.inStock,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,
      brandName: brands.name,
      brandSlug: brands.slug,
      categoryName: categories.name,
      categorySlug: categories.slug,
      genderLabel: genders.label,
      genderSlug: genders.slug,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .where(baseWhere)
    .orderBy(orderBy, asc(products.id))
    .limit(limit)
    .offset(offset);
  
  if (productRows.length === 0) {
    return {
      products: [],
      totalCount: 0,
      stats: { total: 0, published: 0, drafts: 0, simple: 0, configurable: 0 },
    };
  }

  const productIds = productRows.map(p => p.productId);

  // Get variants for these products
  const variantRows = await db
    .select({
      productId: productVariants.productId,
      variantId: productVariants.id,
      variantPrice: productVariants.price,
      variantSalePrice: productVariants.salePrice,
      variantInStock: productVariants.inStock,
    })
    .from(productVariants)
    .where(inArray(productVariants.productId, productIds));

  // Get images for these products
  const imageRows = await db
    .select({
      productId: productImages.productId,
      imageId: productImages.id,
      imageUrl: productImages.url,
      imageIsPrimary: productImages.isPrimary,
    })
    .from(productImages)
    .where(inArray(productImages.productId, productIds));

  // Get total count and stats in parallel
  const [countResult, statsResult] = await Promise.all([
    db
      .select({
        count: count(sql`distinct ${products.id}`),
      })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .where(baseWhere),
    
    db
      .select({
        total: count(),
        published: count(sql`case when ${products.isPublished} = true then 1 end`),
        drafts: count(sql`case when ${products.isPublished} = false then 1 end`),
        simple: count(sql`case when ${products.productType} = 'simple' then 1 end`),
        configurable: count(sql`case when ${products.productType} = 'configurable' then 1 end`),
      })
      .from(products)
      .leftJoin(brands, eq(brands.id, products.brandId))
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .leftJoin(genders, eq(genders.id, products.genderId))
      .where(baseWhere)
  ]);

  const totalCount = countResult[0]?.count ?? 0;
  const stats = {
    total: statsResult[0]?.total ?? 0,
    published: statsResult[0]?.published ?? 0,
    drafts: statsResult[0]?.drafts ?? 0,
    simple: statsResult[0]?.simple ?? 0,
    configurable: statsResult[0]?.configurable ?? 0,
  };

  // Create lookup maps for variants and images
  const variantsByProduct = new Map<string, typeof variantRows>();
  const imagesByProduct = new Map<string, typeof imageRows>();

  for (const variant of variantRows) {
    if (!variantsByProduct.has(variant.productId)) {
      variantsByProduct.set(variant.productId, []);
    }
    variantsByProduct.get(variant.productId)!.push(variant);
  }

  for (const image of imageRows) {
    if (!imagesByProduct.has(image.productId)) {
      imagesByProduct.set(image.productId, []);
    }
    imagesByProduct.get(image.productId)!.push(image);
  }

  // Process results into final product structure
  const products_result: DashboardProductListItem[] = productRows.map(row => ({
    id: row.productId,
    name: row.productName,
    description: row.productDescription,
    brand: row.brandName ? { name: row.brandName, slug: row.brandSlug! } : null,
    category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug! } : null,
    gender: row.genderLabel ? { label: row.genderLabel, slug: row.genderSlug! } : null,
    isPublished: row.isPublished,
    productType: row.productType,
    variants: (variantsByProduct.get(row.productId) || []).map(v => ({
      id: v.variantId,
      price: v.variantPrice,
      salePrice: v.variantSalePrice,
      inStock: v.variantInStock,
      color: null, // Basic version, can be enhanced if needed
      size: null, // Basic version, can be enhanced if needed
    })),
    images: (imagesByProduct.get(row.productId) || []).map(img => ({
      id: img.imageId,
      url: img.imageUrl,
      isPrimary: img.imageIsPrimary,
    })),
    // Simple product fields
    price: row.productPrice,
    salePrice: row.productSalePrice,
    sku: row.productSku,
    inStock: row.productInStock,
    createdAt: row.productCreatedAt,
    updatedAt: row.productUpdatedAt,
  }));

  return {
    products: products_result,
    totalCount,
    stats,
  };
}

export type DashboardProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  };
  variants: Array<
    SelectVariant & {
      color?: { id: string; name: string; slug: string; hexCode: string } | null;
      size?: { id: string; name: string; slug: string; sortOrder: number } | null;
    }
  >;
  images: SelectProductImage[];
};

export async function getDashboardProduct(productId: string): Promise<DashboardProduct | null> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productBrandId: products.brandId,
      productCategoryId: products.categoryId,
      productGenderId: products.genderId,
      productType: products.productType,
      isPublished: products.isPublished,
      productPrice: products.price,
      productSalePrice: products.salePrice,
      productSku: products.sku,
      productInStock: products.inStock,
      productWeight: products.weight,
      productDimensions: products.dimensions,
      defaultVariantId: products.defaultVariantId,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,

      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandLogoUrl: brands.logoUrl,

      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,

      genderId: genders.id,
      genderLabel: genders.label,
      genderSlug: genders.slug,

      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: productVariants.price,
      variantSalePrice: productVariants.salePrice,
      variantColorId: productVariants.colorId,
      variantSizeId: productVariants.sizeId,
      variantInStock: productVariants.inStock,
      variantWeight: productVariants.weight,
      variantDimensions: productVariants.dimensions,
      variantCreatedAt: productVariants.createdAt,

      // Color information
      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHexCode: colors.hexCode,

      // Size information
      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sizeSortOrder: sizes.sortOrder,

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
    .where(eq(products.id, productId));

  if (!rows.length) return null;

  const head = rows[0];

  const product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  } = {
    id: head.productId,
    name: head.productName,
    description: head.productDescription,
    brandId: head.productBrandId,
    categoryId: head.productCategoryId,
    genderId: head.productGenderId,
    productType: head.productType,
    isPublished: head.isPublished,
    price: head.productPrice,
    salePrice: head.productSalePrice,
    sku: head.productSku,
    inStock: head.productInStock,
    weight: head.productWeight,
    dimensions: head.productDimensions,
    defaultVariantId: head.defaultVariantId,
    createdAt: head.productCreatedAt,
    updatedAt: head.productUpdatedAt,
    brand: head.brandId
      ? {
          id: head.brandId,
          name: head.brandName!,
          slug: head.brandSlug!,
          logoUrl: head.brandLogoUrl,
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

  const variantsMap = new Map<string, DashboardProduct["variants"][number]>();
  const imagesMap = new Map<string, SelectProductImage>();

  for (const r of rows) {
    if (r.variantId && !variantsMap.has(r.variantId)) {
      variantsMap.set(r.variantId, {
        id: r.variantId,
        productId: head.productId,
        sku: r.variantSku!,
        price: r.variantPrice!,
        salePrice: r.variantSalePrice,
        colorId: r.variantColorId,
        sizeId: r.variantSizeId,
        inStock: r.variantInStock!,
        weight: r.variantWeight,
        dimensions: r.variantDimensions,
        createdAt: r.variantCreatedAt!,
        color: r.colorId ? {
          id: r.colorId,
          name: r.colorName!,
          slug: r.colorSlug!,
          hexCode: r.colorHexCode!,
        } : null,
        size: r.sizeId ? {
          id: r.sizeId,
          name: r.sizeName!,
          slug: r.sizeSlug!,
          sortOrder: r.sizeSortOrder!,
        } : null,
      });
    }
    if (r.imageId && !imagesMap.has(r.imageId)) {
      imagesMap.set(r.imageId, {
        id: r.imageId,
        productId: head.productId,
        variantId: r.imageVariantId,
        url: r.imageUrl!,
        sortOrder: r.imageSortOrder ?? 0,
        isPrimary: r.imageIsPrimary ?? false,
      });
    }
  }

  return {
    product,
    variants: Array.from(variantsMap.values()),
    images: Array.from(imagesMap.values()),
  };
}

// Get reference data for filters
export async function getDashboardFilterOptions(): Promise<DashboardFilterOptions> {
  const [brandsData, categoriesData] = await Promise.all([
    db
      .select({
        name: brands.name,
        slug: brands.slug,
      })
      .from(brands)
      .orderBy(asc(brands.name)),
    db
      .select({
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(asc(categories.name)),
  ]);

  return {
    brands: brandsData as BrandListItem[],
    categories: categoriesData as CategoryListItem[],
  };
}
