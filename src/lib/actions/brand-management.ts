// src/lib/actions/brand-management.ts
"use server";

import { db } from "@/lib/db";
import { brands, type InsertBrand, type SelectBrand } from "@/lib/db/schema";
import { brandFormSchema, type BrandFormData } from "@/lib/validations/dashboard";
import { eq, asc, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { products } from "@/lib/db/schema";
import { deleteUploadThingFile, isUploadThingUrl } from "@/lib/uploadthing-utils";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Enhanced brand type with product count
export interface BrandWithStats extends SelectBrand {
  productCount: number;
  createdAt: Date;
}

// Get all brands with statistics
export async function getBrands(): Promise<BrandWithStats[]> {
  try {
    const brandsWithStats = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
        productCount: count(products.id),
      })
      .from(brands)
      .leftJoin(products, eq(brands.id, products.brandId))
      .groupBy(brands.id, brands.name, brands.slug, brands.logoUrl)
      .orderBy(asc(brands.name));

    // Transform to BrandWithStats (add createdAt - you may want to add this to schema)
    return brandsWithStats.map(brand => ({
      ...brand,
      createdAt: new Date(), // Placeholder - add actual createdAt field to schema if needed
      productCount: Number(brand.productCount),
    }));
  } catch (error) {
    console.error("Error fetching brands:", error);
    return [];
  }
}

// Get a single brand by ID
export async function getBrandById(brandId: string): Promise<SelectBrand | null> {
  try {
    const result = await db
      .select({
        id: brands.id,
        name: brands.name,
        slug: brands.slug,
        logoUrl: brands.logoUrl,
      })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching brand by ID:", error);
    return null;
  }
}

// Validate slug uniqueness
export async function validateBrandSlugUniqueness(slug: string, excludeBrandId?: string): Promise<boolean> {
  try {
    const existingBrand = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, slug))
      .limit(1);

    // Check if slug exists and it's not the current brand being edited
    if (existingBrand.length > 0 && existingBrand[0].id !== excludeBrandId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating brand slug uniqueness:", error);
    return false;
  }
}

// Server-side validation function
async function validateBrandData(data: BrandFormData, excludeBrandId?: string): Promise<ActionResult> {
  // Schema validation
  const schemaValidation = brandFormSchema.safeParse(data);
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

  // Validate slug uniqueness
  const isSlugUnique = await validateBrandSlugUniqueness(data.slug, excludeBrandId);
  if (!isSlugUnique) {
    errors.slug = ['Slug must be unique'];
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

// Helper function to safely delete image from UploadThing
async function safeDeleteBrandImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !isUploadThingUrl(imageUrl)) {
    return; // Nothing to delete or not an UploadThing URL
  }
  
  try {
    const deleted = await deleteUploadThingFile(imageUrl);
    if (deleted) {
      console.log(`Successfully deleted brand image: ${imageUrl}`);
    } else {
      console.warn(`Failed to delete brand image: ${imageUrl}`);
    }
  } catch (error) {
    console.error("Error deleting brand image from UploadThing:", error);
    // Don't throw here - we don't want to fail the whole operation if image cleanup fails
  }
}

// Create brand function
export async function createBrand(data: BrandFormData): Promise<ActionResult<{ brandId: string }>> {
  try {
    // Server-side validation
    const validation = await validateBrandData(data);
    if (!validation.success) {
      return validation as ActionResult<{ brandId: string }>;
    }

    // Validate image URL if provided
    if (data.logoUrl && (!data.logoUrl.startsWith('http') && !data.logoUrl.startsWith('https'))) {
      return {
        success: false,
        error: "Invalid logo URL. Please upload a valid image.",
        fieldErrors: {
          logoUrl: ["Invalid logo URL format"]
        }
      };
    }

    // Create the brand
    const brandData: InsertBrand = {
      name: data.name,
      slug: data.slug,
      logoUrl: data.logoUrl || null,
    };

    const [createdBrand] = await db
      .insert(brands)
      .values(brandData)
      .returning({ id: brands.id });

    // Revalidate relevant paths
    revalidatePath('/dashboard/brands');
    revalidatePath('/products');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { brandId: createdBrand.id },
    };
  } catch (error) {
    console.error("Error creating brand:", error);
    return {
      success: false,
      error: "Failed to create brand. Please try again.",
    };
  }
}

// Update brand function
export async function updateBrand(
  brandId: string,
  data: BrandFormData
): Promise<ActionResult<{ brandId: string }>> {
  try {
    // Get current brand data to check for logo changes
    const currentBrand = await getBrandById(brandId);
    if (!currentBrand) {
      return {
        success: false,
        error: "Brand not found.",
      };
    }

    // Server-side validation (excluding current brand from slug uniqueness check)
    const validation = await validateBrandData(data, brandId);
    if (!validation.success) {
      return validation as ActionResult<{ brandId: string }>;
    }

    // Validate image URL if provided
    if (data.logoUrl && (!data.logoUrl.startsWith('http') && !data.logoUrl.startsWith('https'))) {
      return {
        success: false,
        error: "Invalid logo URL. Please upload a valid image.",
        fieldErrors: {
          logoUrl: ["Invalid logo URL format"]
        }
      };
    }

    // Check if logo is being removed or replaced
    const oldLogoUrl = currentBrand.logoUrl;
    const newLogoUrl = data.logoUrl || null;
    
    // If logo is being removed or replaced, delete the old one
    if (oldLogoUrl && oldLogoUrl !== newLogoUrl) {
      await safeDeleteBrandImage(oldLogoUrl);
    }

    // Update the brand
    const brandData: Partial<InsertBrand> = {
      name: data.name,
      slug: data.slug,
      logoUrl: newLogoUrl,
    };

    await db
      .update(brands)
      .set(brandData)
      .where(eq(brands.id, brandId));

    // Revalidate relevant paths
    revalidatePath('/dashboard/brands');
    revalidatePath('/products');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { brandId },
    };
  } catch (error) {
    console.error("Error updating brand:", error);
    return {
      success: false,
      error: "Failed to update brand. Please try again.",
    };
  }
}

// Delete brand function
export async function deleteBrand(brandId: string): Promise<ActionResult> {
  try {
    // Get brand data to check for logo
    const brand = await getBrandById(brandId);
    if (!brand) {
      return {
        success: false,
        error: "Brand not found.",
      };
    }

    // Check if brand has products
    const brandProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.brandId, brandId))
      .limit(1);

    if (brandProducts.length > 0) {
      return {
        success: false,
        error: "Cannot delete brand with associated products. Please reassign or delete products first.",
      };
    }

    // Delete logo from UploadThing if it exists
    if (brand.logoUrl) {
      await safeDeleteBrandImage(brand.logoUrl);
    }

    // Delete the brand
    await db.delete(brands).where(eq(brands.id, brandId));

    // Revalidate relevant paths
    revalidatePath('/dashboard/brands');
    revalidatePath('/products');
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error("Error deleting brand:", error);
    return {
      success: false,
      error: "Failed to delete brand. Please try again.",
    };
  }
}

// Form submission action with redirect for creation
export async function submitBrandForm(data: BrandFormData): Promise<never> {
  const result = await createBrand(data);
  
  if (result.success) {
    redirect('/dashboard/brands?success=created');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/brands/new?${errorParams.toString()}`);
  }
}

// Form submission action with redirect for update
export async function submitBrandUpdateForm(brandId: string, data: BrandFormData): Promise<never> {
  const result = await updateBrand(brandId, data);
  
  if (result.success) {
    redirect('/dashboard/brands?success=updated');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/brands/${brandId}/edit?${errorParams.toString()}`);
  }
}
