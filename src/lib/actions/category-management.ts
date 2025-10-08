// src/lib/actions/category-management.ts
"use server";

import { db } from "@/lib/db";
import { categories, type InsertCategory, type SelectCategory } from "@/lib/db/schema";
import { categoryFormSchema, type CategoryFormData } from "@/lib/validations/dashboard";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteUploadThingFile, isUploadThingUrl } from "@/lib/uploadthing-utils";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Enhanced category type with hierarchy information
export interface CategoryWithHierarchy extends SelectCategory {
  level: number;
  path: string[];
  childCount: number;
}

// Get all categories with hierarchy information
export async function getCategories(): Promise<CategoryWithHierarchy[]> {
  try {
    const allCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        parentId: categories.parentId,
        imageUrl: categories.imageUrl,
      })
      .from(categories)
      .orderBy(asc(categories.name));

    // Build category map for efficient lookups
    const categoryMap = new Map<string, SelectCategory>();
    allCategories.forEach(cat => categoryMap.set(cat.id, cat));

    // Calculate hierarchy information
    const getLevel = (categoryId: string): number => {
      const category = categoryMap.get(categoryId);
      if (!category?.parentId) return 1;
      return 1 + getLevel(category.parentId);
    };

    const getPath = (categoryId: string): string[] => {
      const category = categoryMap.get(categoryId);
      if (!category) return [];
      if (!category.parentId) return [category.name];
      return [...getPath(category.parentId), category.name];
    };

    // Transform to CategoryWithHierarchy
    const categoriesWithHierarchy: CategoryWithHierarchy[] = allCategories.map(category => ({
      ...category,
      level: getLevel(category.id),
      path: getPath(category.id),
      childCount: allCategories.filter(cat => cat.parentId === category.id).length,
    }));

    // Sort by path for hierarchical display
    return categoriesWithHierarchy.sort((a, b) => 
      a.path.join('/').localeCompare(b.path.join('/'))
    );
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

// Get available parent categories (only levels 1-2 to enforce 3-level limit)
export async function getAvailableParentCategories(excludeCategoryId?: string): Promise<CategoryWithHierarchy[]> {
  try {
    const allCategories = await getCategories();
    
    // Filter to only show categories that are level 1 or 2 (can have children)
    let availableParents = allCategories.filter(cat => cat.level <= 2);
    
    // If editing a category, exclude itself and its descendants
    if (excludeCategoryId) {
      const getDescendantIds = (parentId: string, visited = new Set<string>()): Set<string> => {
        if (visited.has(parentId)) return new Set(); // Prevent infinite loops
        visited.add(parentId);
        
        const descendants = new Set([parentId]);
        allCategories
          .filter(cat => cat.parentId === parentId)
          .forEach(child => {
            const childDescendants = getDescendantIds(child.id, visited);
            childDescendants.forEach(id => descendants.add(id));
          });
        
        return descendants;
      };

      const excludedIds = getDescendantIds(excludeCategoryId);
      availableParents = availableParents.filter(cat => !excludedIds.has(cat.id));
    }

    return availableParents;
  } catch (error) {
    console.error("Error fetching available parent categories:", error);
    return [];
  }
}

// Get a single category by ID
export async function getCategoryById(categoryId: string): Promise<SelectCategory | null> {
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
      .where(eq(categories.id, categoryId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching category by ID:", error);
    return null;
  }
}

// Validate slug uniqueness
export async function validateSlugUniqueness(slug: string, excludeCategoryId?: string): Promise<boolean> {
  try {
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    // Check if slug exists and it's not the current category being edited
    if (existingCategory.length > 0 && existingCategory[0].id !== excludeCategoryId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating slug uniqueness:", error);
    return false;
  }
}

// Server-side validation function
async function validateCategoryData(data: CategoryFormData, excludeCategoryId?: string): Promise<ActionResult> {
  // Schema validation
  const schemaValidation = categoryFormSchema.safeParse(data);
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
  const isSlugUnique = await validateSlugUniqueness(data.slug, excludeCategoryId);
  if (!isSlugUnique) {
    errors.slug = ['Slug must be unique'];
  }

  // Validate hierarchy constraints
  if (data.parentId) {
    const parentCategory = await getCategoryById(data.parentId);
    if (!parentCategory) {
      errors.parentId = ['Invalid parent category'];
    } else {
      // Check if parent would create a level beyond 3
      const parentCategories = await getCategories();
      const parent = parentCategories.find(cat => cat.id === data.parentId);
      if (parent && parent.level >= 3) {
        errors.parentId = ['Cannot create category beyond level 3. Maximum hierarchy depth is 3 levels.'];
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

// Create category function
export async function createCategory(data: CategoryFormData): Promise<ActionResult<{ categoryId: string }>> {
  try {
    // Server-side validation
    const validation = await validateCategoryData(data);
    if (!validation.success) {
      return validation as ActionResult<{ categoryId: string }>;
    }

    // Validate image URL if provided
    if (data.imageUrl && (!data.imageUrl.startsWith('http') && !data.imageUrl.startsWith('https'))) {
      return {
        success: false,
        error: "Invalid image URL. Please upload a valid image.",
        fieldErrors: {
          imageUrl: ["Invalid image URL format"]
        }
      };
    }

    // Create the category
    const categoryData: InsertCategory = {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      imageUrl: data.imageUrl || null,
    };

    const [createdCategory] = await db
      .insert(categories)
      .values(categoryData)
      .returning({ id: categories.id });

    // Revalidate relevant paths
    revalidatePath('/dashboard/categories');
    revalidatePath('/products');

    return {
      success: true,
      data: { categoryId: createdCategory.id },
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: "Failed to create category. Please try again.",
    };
  }
}

// Update category function
export async function updateCategory(
  categoryId: string,
  data: CategoryFormData
): Promise<ActionResult<{ categoryId: string }>> {
  try {
    // Get current category data to check for image changes
    const currentCategory = await getCategoryById(categoryId);
    if (!currentCategory) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    // Server-side validation (excluding current category from slug uniqueness check)
    const validation = await validateCategoryData(data, categoryId);
    if (!validation.success) {
      return validation as ActionResult<{ categoryId: string }>;
    }

    // Validate image URL if provided
    if (data.imageUrl && (!data.imageUrl.startsWith('http') && !data.imageUrl.startsWith('https'))) {
      return {
        success: false,
        error: "Invalid image URL. Please upload a valid image.",
        fieldErrors: {
          imageUrl: ["Invalid image URL format"]
        }
      };
    }

    // Check if image is being removed or replaced
    const oldImageUrl = currentCategory.imageUrl;
    const newImageUrl = data.imageUrl || null;
    
    // If image is being removed or replaced, delete the old one
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      await safeDeleteCategoryImage(oldImageUrl);
    }

    // Update the category
    const categoryData: Partial<InsertCategory> = {
      name: data.name,
      slug: data.slug,
      parentId: data.parentId || null,
      imageUrl: data.imageUrl || null,
    };

    await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, categoryId));

    // Revalidate relevant paths
    revalidatePath('/dashboard/categories');
    revalidatePath('/products');

    return {
      success: true,
      data: { categoryId },
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: "Failed to update category. Please try again.",
    };
  }
}

// Helper function to safely delete category image from UploadThing
async function safeDeleteCategoryImage(imageUrl: string | null): Promise<void> {
  if (!imageUrl || !isUploadThingUrl(imageUrl)) {
    return; // Nothing to delete or not an UploadThing URL
  }
  
  try {
    const deleted = await deleteUploadThingFile(imageUrl);
    if (deleted) {
      console.log(`Successfully deleted category image: ${imageUrl}`);
    } else {
      console.warn(`Failed to delete category image: ${imageUrl}`);
    }
  } catch (error) {
    console.error("Error deleting category image from UploadThing:", error);
    // Don't throw here - we don't want to fail the whole operation if image cleanup fails
  }
}

// Delete category function
export async function deleteCategory(categoryId: string): Promise<ActionResult> {
  try {
    // Get category data to check for image
    const category = await getCategoryById(categoryId);
    if (!category) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    // Check if category has children
    const children = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.parentId, categoryId))
      .limit(1);

    if (children.length > 0) {
      return {
        success: false,
        error: "Cannot delete category with subcategories. Please delete or reassign subcategories first.",
      };
    }

    // Delete image from UploadThing if it exists
    if (category.imageUrl) {
      await safeDeleteCategoryImage(category.imageUrl);
    }

    // Delete the category
    await db.delete(categories).where(eq(categories.id, categoryId));

    // Revalidate relevant paths
    revalidatePath('/dashboard/categories');
    revalidatePath('/products');

    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: "Failed to delete category. Please try again.",
    };
  }
}

// Form submission action with redirect for creation
export async function submitCategoryForm(data: CategoryFormData): Promise<never> {
  const result = await createCategory(data);
  
  if (result.success) {
    redirect('/dashboard/categories?success=created');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/categories/new?${errorParams.toString()}`);
  }
}

// Form submission action with redirect for update
export async function submitCategoryUpdateForm(categoryId: string, data: CategoryFormData): Promise<never> {
  const result = await updateCategory(categoryId, data);
  
  if (result.success) {
    redirect('/dashboard/categories?success=updated');
  } else {
    // Serialize the error data for URL parameters
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/categories/${categoryId}/edit?${errorParams.toString()}`);
  }
}
