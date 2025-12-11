// src/lib/actions/product-management.ts (UPDATED SECTION)
"use server";

import { db } from "@/lib/db";
import {
  products,
  productVariants,
  productImages,
  brands,
  categories,
  genders,
  colors,
  sizes,
  sizeCategories,
  type InsertProduct,
  type InsertVariant,
  type InsertProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
  type SelectSizeCategory,
  SelectSizeWithCategory,
} from "@/lib/db/schema";
import {
  completeProductFormSchema,
  type CompleteProductFormData
} from "@/lib/validations/product-form";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteUploadThingFiles, isUploadThingUrl } from "@/lib/uploadthing-utils";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Reference data fetching functions
export async function getBrands(): Promise<SelectBrand[]> {
  try {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
      })
      .from(brands)
      .orderBy(asc(brands.name));

    return result;
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

export async function getCategories(): Promise<SelectCategory[]> {
  try {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        imageUrl: categories.imageUrl,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    return result;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export async function getGenders(): Promise<SelectGender[]> {
  try {
    const result = await db
      .select({
        id: genders.id,
        label: genders.label,
        slug: genders.slug,
      })
      .from(genders)
      .orderBy(asc(genders.label));

    return result;
  } catch (error) {
    console.error("Error fetching genders:", error);
    return [];
  }
}

export async function getColors(): Promise<SelectColor[]> {
  try {
    const result = await db
      .select({
        id: colors.id,
        name: colors.name,
        slug: colors.slug,
        hexCode: colors.hexCode,
      })
      .from(colors)
      .orderBy(asc(colors.name));

    return result;
  } catch (error) {
    console.error("Error fetching colors:", error);
    return [];
  }
}

// UPDATED: Single query with relations using Drizzle's query API
export async function getSizesWithCategories(): Promise<SelectSizeWithCategory[]> {
  try {
    const result = await db.query.sizes.findMany({
      orderBy: [asc(sizes.sortOrder)],
      with: {
        category: true, // Leverages the existing relation!
      },
    });

    return result;
  } catch (error) {
    console.error("Error fetching sizes with categories:", error);
    return [];
  }
}

// UPDATED: Get all reference data including size categories
export async function getProductFormReferenceData() {
  try {
    const [
      brandsData,
      categoriesData,
      gendersData,
      colorsData,
      sizesData, // Now includes category data inline!
    ] = await Promise.all([
      getBrands(),
      getCategories(),
      getGenders(),
      getColors(),
      getSizesWithCategories(), // Single call instead of two!
    ]);

    return {
      brands: brandsData,
      categories: categoriesData,
      genders: gendersData,
      colors: colorsData,
      sizes: sizesData, // Each size now has .category property
    };
  } catch (error) {
    console.error("Error fetching reference data:", error);
    return {
      brands: [],
      categories: [],
      genders: [],
      colors: [],
      sizes: [],
    };
  }
}


// NEW: Validate slug uniqueness
export async function validateSlugUniqueness(slug: string, excludeProductId?: string): Promise<boolean> {
  try {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);

    if (existing.length === 0) return true;
    if (excludeProductId && existing[0].id === excludeProductId) return true;

    return false;
  } catch (error) {
    console.error("Error validating slug uniqueness:", error);
    return false;
  }
}

// Validate SKU uniqueness
export async function validateSkuUniqueness(sku: string, excludeProductId?: string): Promise<boolean> {
  try {
    // Check both products and variants tables for SKU conflicts
    const [productResults, variantResults] = await Promise.all([
      db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1),
      db
        .select({ productId: productVariants.productId })
        .from(productVariants)
        .where(eq(productVariants.sku, sku))
        .limit(1)
    ]);

    // Check if SKU exists in products table (excluding current product)
    if (productResults.length > 0 && productResults[0].id !== excludeProductId) {
      return false;
    }

    // Check if SKU exists in variants table (excluding current product's variants)
    if (variantResults.length > 0 && variantResults[0].productId !== excludeProductId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating SKU uniqueness:", error);
    return false;
  }
}

// Server-side validation function
async function validateProductData(data: CompleteProductFormData, excludeProductId?: string): Promise<ActionResult> {
  // Schema validation
  const schemaValidation = completeProductFormSchema.safeParse(data);
  if (!schemaValidation.success) {
    const fieldErrors: Record<string, string[]> = {};
    schemaValidation.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(issue.message);
    });

    return {
      success: false,
      error: "Validation failed",
      fieldErrors,
    };
  }

  // Business logic validation
  const errors: Record<string, string[]> = {};

  // NEW: Validate slug uniqueness
  if (data.slug) {
    const isSlugUnique = await validateSlugUniqueness(data.slug, excludeProductId);
    if (!isSlugUnique) {
      errors.slug = ['This slug is already in use. Please choose a different one.'];
    }
  }

  // Validate SKU uniqueness for simple products
  if (data.productType === 'simple' && data.sku) {
    const isSkuUnique = await validateSkuUniqueness(data.sku, excludeProductId);
    if (!isSkuUnique) {
      errors.sku = ['SKU must be unique'];
    }
  }

  // Validate variant SKUs uniqueness for configurable products
  if (data.productType === 'configurable' && data.variants) {
    const skuSet = new Set<string>();

    for (let i = 0; i < data.variants.length; i++) {
      const variant = data.variants[i];
      if (variant.sku) {
        // Check for duplicate SKUs within variants
        if (skuSet.has(variant.sku)) {
          errors[`variants.${i}.sku`] = ['Duplicate SKU within variants'];
        } else {
          skuSet.add(variant.sku);

          // Check for uniqueness across database
          const isSkuUnique = await validateSkuUniqueness(variant.sku, excludeProductId);
          if (!isSkuUnique) {
            errors[`variants.${i}.sku`] = ['SKU must be unique'];
          }
        }
      }
    }
  }

  // Validate sale price vs regular price for simple products
  if (data.productType === 'simple' && data.salePrice && data.price) {
    const regularPrice = parseFloat(data.price);
    const salePrice = parseFloat(data.salePrice);
    if (salePrice >= regularPrice) {
      errors.salePrice = ['Sale price must be less than regular price'];
    }
  }

  // Validate sale price vs regular price for variants
  if (data.productType === 'configurable' && data.variants) {
    for (let i = 0; i < data.variants.length; i++) {
      const variant = data.variants[i];
      if (variant.salePrice && variant.price) {
        const regularPrice = parseFloat(variant.price);
        const salePrice = parseFloat(variant.salePrice);
        if (salePrice >= regularPrice) {
          errors[`variants.${i}.salePrice`] = ['Sale price must be less than regular price'];
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      error: "Business validation failed",
      fieldErrors: errors,
    };
  }

  return { success: true };
}

// Main product creation function
export async function createProduct(data: CompleteProductFormData): Promise<ActionResult<{ productId: string }>> {
  try {
    // Server-side validation
    const validation = await validateProductData(data);
    if (!validation.success) {
      return validation as ActionResult<{ productId: string }>;
    }

    // Validate image URLs before proceeding (ATOMIC TRANSACTION VALIDATION)
    if (data.images && data.images.length > 0) {
      const invalidImages = data.images.filter(img =>
        !img.url ||
        (!img.url.startsWith('http') && !img.url.startsWith('https')) ||
        img.url.includes('blob:') ||
        img.url.includes('example.com')
      );

      if (invalidImages.length > 0) {
        console.error(`Server validation failed: ${invalidImages.length} invalid image URLs detected`, {
          invalidImages: invalidImages.map(img => ({ id: img.id, url: img.url }))
        });
        return {
          success: false,
          error: `${invalidImages.length} image(s) have invalid URLs. All images must be properly uploaded before creating the product.`,
          fieldErrors: {
            images: [`Invalid image URLs detected. Please re-upload your images.`]
          }
        };
      }
    }

    // Start atomic database transaction
    const result = await db.transaction(async (tx) => {
      // Create the main product
      const productData: InsertProduct = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId || null,
        genderId: data.genderId || null,
        brandId: data.brandId || null,
        isPublished: data.isPublished,
        productType: data.productType,
        // For simple products, store pricing directly
        price: data.productType === 'simple' ? data.price : null,
        salePrice: data.productType === 'simple' ? data.salePrice : null,
        sku: data.productType === 'simple' ? data.sku : null,
        inStock: data.productType === 'simple' ? data.inStock : null,
        weight: data.productType === 'simple' ? data.weight : null,
        dimensions: data.productType === 'simple' ? data.dimensions : null,
      };

      const [createdProduct] = await tx
        .insert(products)
        .values(productData)
        .returning({ id: products.id });

      const productId = createdProduct.id;

      // Create variants for configurable products and track ID mapping
      const variantIdMapping = new Map<string, string>(); // temp ID -> real ID

      if (data.productType === 'configurable' && data.variants && data.variants.length > 0) {
        const variantInserts: InsertVariant[] = data.variants.map(variant => ({
          productId,
          sku: variant.sku!,
          price: variant.price,
          salePrice: variant.salePrice || null,
          colorId: variant.colorId || null,
          sizeId: variant.sizeId || null,
          inStock: variant.inStock || 0,
          weight: variant.weight || null,
          dimensions: variant.dimensions || null,
        }));

        const createdVariants = await tx.insert(productVariants).values(variantInserts).returning({
          id: productVariants.id,
          sku: productVariants.sku
        });

        // Map temporary variant IDs to real database IDs using SKU as the key
        data.variants.forEach((variant, index) => {
          if (variant.id && createdVariants[index]) {
            variantIdMapping.set(variant.id, createdVariants[index].id);
          }
        });
      }

      // Create product images
      if (data.images && data.images.length > 0) {
        // Final validation of image URLs within transaction
        const invalidImages = data.images.filter(img =>
          !img.url ||
          (!img.url.startsWith('http') && !img.url.startsWith('https'))
        );

        if (invalidImages.length > 0) {
          throw new Error(`Transaction aborted: ${invalidImages.length} image(s) have invalid URLs`);
        }

        const imageInserts: InsertProductImage[] = data.images.map((image, index) => {
          // Map temporary variant ID to real variant ID if it exists
          let realVariantId: string | null = null;
          if (image.variantId) {
            if (variantIdMapping.has(image.variantId)) {
              realVariantId = variantIdMapping.get(image.variantId)!;
            } else if (image.variantId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
              // If it's already a valid UUID, use it as is
              realVariantId = image.variantId;
            }
            // If it's a temp ID that doesn't exist in mapping, set to null
          }

          return {
            productId,
            variantId: realVariantId,
            url: image.url,
            sortOrder: image.sortOrder ?? index,
            isPrimary: image.isPrimary ?? false,
          };
        });

        try {
          await tx.insert(productImages).values(imageInserts);
        } catch (imageError) {
          console.error("Failed to insert product images:", imageError);
          throw new Error("Failed to save product images. Transaction aborted.");
        }
      }

      return { productId };
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard/products');
    revalidatePath('/products');
    // revalidatePath(`/products/${result.slug}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: "Failed to create product. Please try again.",
    };
  }
}

// src/lib/actions/product-management.ts
// Update product function (FIXED: Preserves variants referenced by carts)
export async function updateProduct(
  productId: string,
  data: CompleteProductFormData
): Promise<ActionResult<{ productId: string }>> {
  try {
    // Server-side validation (excluding current product from SKU uniqueness check)
    const validation = await validateProductData(data, productId);
    if (!validation.success) {
      return validation as ActionResult<{ productId: string }>;
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Update the main product
      const productData: Partial<InsertProduct> = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId || null,
        genderId: data.genderId || null,
        brandId: data.brandId || null,
        isPublished: data.isPublished,
        productType: data.productType,
        // For simple products, store pricing directly
        price: data.productType === 'simple' ? data.price : null,
        salePrice: data.productType === 'simple' ? data.salePrice : null,
        sku: data.productType === 'simple' ? data.sku : null,
        inStock: data.productType === 'simple' ? data.inStock : null,
        weight: data.productType === 'simple' ? data.weight : null,
        dimensions: data.productType === 'simple' ? data.dimensions : null,
        updatedAt: new Date(),
      };

      await tx
        .update(products)
        .set(productData)
        .where(eq(products.id, productId));

      // Handle variants for configurable products and track ID mapping
      const variantIdMapping = new Map<string, string>(); // temp ID -> real ID

      if (data.productType === 'configurable') {
        // FIXED: Fetch existing variants first
        const existingVariants = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, productId));

        // Create a map of existing variant IDs by SKU
        const existingVariantMap = new Map(
          existingVariants.map(v => [v.sku, v])
        );

        // Track which existing variants are still needed
        const updatedVariantIds = new Set<string>();

        if (data.variants && data.variants.length > 0) {
          for (const variant of data.variants) {
            const existingVariant = existingVariantMap.get(variant.sku!);

            if (existingVariant) {
              // UPDATE: Variant with this SKU exists, update it
              await tx
                .update(productVariants)
                .set({
                  price: variant.price,
                  salePrice: variant.salePrice || null,
                  colorId: variant.colorId || null,
                  sizeId: variant.sizeId || null,
                  inStock: variant.inStock || 0,
                  weight: variant.weight || null,
                  dimensions: variant.dimensions || null,
                })
                .where(eq(productVariants.id, existingVariant.id));

              // Map the variant ID (handle both temp IDs and real UUIDs)
              if (variant.id) {
                variantIdMapping.set(variant.id, existingVariant.id);
              }
              updatedVariantIds.add(existingVariant.id);
            } else {
              // CREATE: New variant, insert it
              const [newVariant] = await tx
                .insert(productVariants)
                .values({
                  productId,
                  sku: variant.sku!,
                  price: variant.price,
                  salePrice: variant.salePrice || null,
                  colorId: variant.colorId || null,
                  sizeId: variant.sizeId || null,
                  inStock: variant.inStock || 0,
                  weight: variant.weight || null,
                  dimensions: variant.dimensions || null,
                })
                .returning({ id: productVariants.id });

              // Map the variant ID
              if (variant.id) {
                variantIdMapping.set(variant.id, newVariant.id);
              }
              updatedVariantIds.add(newVariant.id);
            }
          }
        }

        // DELETE: Remove variants that are no longer in the update (and not referenced by cart items)
        const variantsToDelete = existingVariants.filter(
          v => !updatedVariantIds.has(v.id)
        );

        for (const variant of variantsToDelete) {
          try {
            await tx
              .delete(productVariants)
              .where(eq(productVariants.id, variant.id));
          } catch (deleteError) {
            // If deletion fails due to foreign key constraint, continue (variant is still referenced)
            const error = deleteError as { code?: string };
            if (error.code === '23503') {
              // Variant is still referenced by cart items, skip deletion
              // In production, consider marking variant as inactive instead of deleting
              continue;
            } else {
              throw deleteError; // Re-throw unexpected errors
            }
          }
        }
      } else {
        // If switching from configurable to simple, attempt to clean up variants
        const existingVariants = await tx
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, productId));

        for (const variant of existingVariants) {
          try {
            await tx
              .delete(productVariants)
              .where(eq(productVariants.id, variant.id));
          } catch (deleteError) {
            const error = deleteError as { code?: string };
            if (error.code === '23503') {
              // Variant is still referenced by cart items, skip deletion
              continue;
            } else {
              throw deleteError;
            }
          }
        }
      }

      // Handle images - get existing images before deletion for cleanup
      const existingImages = await tx
        .select({ url: productImages.url })
        .from(productImages)
        .where(eq(productImages.productId, productId));

      // Delete existing images from database
      await tx.delete(productImages).where(eq(productImages.productId, productId));

      if (data.images && data.images.length > 0) {
        const imageInserts: InsertProductImage[] = data.images.map((image, index) => {
          // Map temporary variant ID to real variant ID if it exists
          let realVariantId: string | null = null;
          if (image.variantId) {
            if (variantIdMapping.has(image.variantId)) {
              realVariantId = variantIdMapping.get(image.variantId)!;
            } else if (image.variantId.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
              // If it's already a valid UUID, use it as is
              realVariantId = image.variantId;
            }
            // If it's a temp ID that doesn't exist in mapping, set to null
          }

          return {
            productId,
            variantId: realVariantId,
            url: image.url,
            sortOrder: image.sortOrder ?? index,
            isPrimary: image.isPrimary ?? false,
          };
        });

        await tx.insert(productImages).values(imageInserts);
      }

      // Clean up removed images from UploadThing (after successful transaction)
      if (existingImages.length > 0) {
        const newImageUrls = new Set(data.images?.map(img => img.url) || []);
        const imagesToDelete = existingImages
          .map(img => img.url)
          .filter(url => url && !newImageUrls.has(url) && isUploadThingUrl(url));

        if (imagesToDelete.length > 0) {
          // Delete in background, don't wait or fail if cleanup fails
          deleteUploadThingFiles(imagesToDelete).catch(error => {
            console.error('[CLEANUP] Failed to delete removed product images:', error);
          });
          console.log(`[CLEANUP] Scheduled deletion of ${imagesToDelete.length} removed product images`);
        }
      }

      return { productId };
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard/products');
    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: "Failed to update product. Please try again.",
    };
  }
}

// Delete product function
export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    // Get all product images before deletion for cleanup
    const imagesToCleanup = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, productId));

    await db.transaction(async (tx) => {
      // Delete related images (cascade will handle this, but being explicit)
      await tx.delete(productImages).where(eq(productImages.productId, productId));

      // Delete related variants (cascade will handle this, but being explicit)
      await tx.delete(productVariants).where(eq(productVariants.productId, productId));

      // Delete the product
      await tx.delete(products).where(eq(products.id, productId));
    });

    // Clean up images from UploadThing after successful deletion
    if (imagesToCleanup.length > 0) {
      const imageUrls = imagesToCleanup
        .map(img => img.url)
        .filter(url => url && isUploadThingUrl(url));

      if (imageUrls.length > 0) {
        // Delete in background, don't wait or fail if cleanup fails
        deleteUploadThingFiles(imageUrls).catch(error => {
          console.error('[CLEANUP] Failed to delete product images:', error);
        });
        console.log(`[CLEANUP] Scheduled deletion of ${imageUrls.length} product images`);
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/products');
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: "Failed to delete product. Please try again.",
    };
  }
}

// Form submission action with redirect
export async function submitProductForm(data: CompleteProductFormData): Promise<never> {
  const result = await createProduct(data);

  if (result.success) {
    redirect('/dashboard/products?success=created');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');

    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }

    redirect(`/dashboard/products/new?${errorParams.toString()}`);
  }
}

// Update form submission action with redirect
export async function submitProductUpdateForm(productId: string, data: CompleteProductFormData): Promise<never> {
  const result = await updateProduct(productId, data);

  if (result.success) {
    redirect('/dashboard/products?success=updated');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');

    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }

    redirect(`/dashboard/products/${productId}/edit?${errorParams.toString()}`);
  }
}