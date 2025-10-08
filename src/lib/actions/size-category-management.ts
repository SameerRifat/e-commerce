// src/lib/actions/size-category-management.ts
"use server";

import { db } from "@/lib/db";
import { sizeCategories, sizes, type InsertSizeCategory, type SelectSizeCategory } from "@/lib/db/schema";
import { eq, asc, ilike, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Enhanced size category type with size count
export interface SizeCategoryWithStats extends SelectSizeCategory {
  sizeCount: number;
}

// Get all size categories with optional search
export async function getSizeCategories(search?: string): Promise<SizeCategoryWithStats[]> {
  try {
    const searchCondition = search
      ? ilike(sizeCategories.name, `%${search}%`)
      : undefined;

    const categoriesResult = await db
      .select({
        id: sizeCategories.id,
        name: sizeCategories.name,
        createdAt: sizeCategories.createdAt,
        sizeCount: sql<number>`cast(coalesce(count(sizes.id), 0) as integer)`.as('size_count'),
      })
      .from(sizeCategories)
      .leftJoin(sizes, eq(sizeCategories.id, sizes.categoryId))
      .where(searchCondition)
      .groupBy(sizeCategories.id, sizeCategories.name, sizeCategories.createdAt)
      .orderBy(asc(sizeCategories.name));

    return categoriesResult.map(category => ({
      ...category,
      sizeCount: Number(category.sizeCount),
    }));
  } catch (error) {
    console.error("Error fetching size categories:", error);
    return [];
  }
}

// Get a single size category by ID
export async function getSizeCategoryById(categoryId: string): Promise<SelectSizeCategory | null> {
  try {
    const result = await db
      .select({
        id: sizeCategories.id,
        name: sizeCategories.name,
        createdAt: sizeCategories.createdAt,
      })
      .from(sizeCategories)
      .where(eq(sizeCategories.id, categoryId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching size category by ID:", error);
    return null;
  }
}

// Create a new size category
export async function createSizeCategory(name: string): Promise<ActionResult<{ categoryId: string }>> {
  try {
    // Validate input
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: "Category name is required",
        fieldErrors: {
          name: ['Category name is required']
        },
      };
    }

    if (name.length > 50) {
      return {
        success: false,
        error: "Category name is too long",
        fieldErrors: {
          name: ['Category name must be 50 characters or less']
        },
      };
    }

    const trimmedName = name.trim();

    // Check if category name already exists
    const existingCategory = await db
      .select({ id: sizeCategories.id })
      .from(sizeCategories)
      .where(eq(sizeCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0) {
      return {
        success: false,
        error: "Category name already exists",
        fieldErrors: {
          name: ['A category with this name already exists']
        },
      };
    }

    // Create the category
    const [createdCategory] = await db
      .insert(sizeCategories)
      .values({
        name: trimmedName,
      } satisfies InsertSizeCategory)
      .returning({ id: sizeCategories.id });

    // Revalidate relevant paths
    revalidatePath('/dashboard/attributes/sizes');

    return {
      success: true,
      data: { categoryId: createdCategory.id },
    };
  } catch (error) {
    console.error("Error creating size category:", error);
    return {
      success: false,
      error: "Failed to create category. Please try again.",
    };
  }
}

// Update a size category
export async function updateSizeCategory(
  categoryId: string,
  name: string
): Promise<ActionResult<{ categoryId: string }>> {
  try {
    // Validate input
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: "Category name is required",
        fieldErrors: {
          name: ['Category name is required']
        },
      };
    }

    if (name.length > 50) {
      return {
        success: false,
        error: "Category name is too long",
        fieldErrors: {
          name: ['Category name must be 50 characters or less']
        },
      };
    }

    const trimmedName = name.trim();

    // Check if category name already exists (excluding current category)
    const existingCategory = await db
      .select({ id: sizeCategories.id })
      .from(sizeCategories)
      .where(eq(sizeCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0 && existingCategory[0].id !== categoryId) {
      return {
        success: false,
        error: "Category name already exists",
        fieldErrors: {
          name: ['A category with this name already exists']
        },
      };
    }

    // Update the category
    const updateResult = await db
      .update(sizeCategories)
      .set({ name: trimmedName })
      .where(eq(sizeCategories.id, categoryId))
      .returning({ id: sizeCategories.id });

    if (updateResult.length === 0) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/attributes/sizes');

    return {
      success: true,
      data: { categoryId },
    };
  } catch (error) {
    console.error("Error updating size category:", error);
    return {
      success: false,
      error: "Failed to update category. Please try again.",
    };
  }
}

// Delete a size category
export async function deleteSizeCategory(categoryId: string): Promise<ActionResult> {
  try {
    // Check if category exists and has associated sizes
    const categoryCheck = await db
      .select({
        categoryExists: sql<boolean>`case when size_categories.id is not null then true else false end`,
        sizeCount: sql<number>`cast(coalesce(count(sizes.id), 0) as integer)`,
      })
      .from(sizeCategories)
      .leftJoin(sizes, eq(sizeCategories.id, sizes.categoryId))
      .where(eq(sizeCategories.id, categoryId))
      .groupBy(sizeCategories.id);

    const result = categoryCheck[0];

    if (!result?.categoryExists) {
      return {
        success: false,
        error: "Category not found.",
      };
    }

    if (result.sizeCount > 0) {
      return {
        success: false,
        error: "Cannot delete category with associated sizes. Please reassign or delete sizes first.",
      };
    }

    // Delete the category
    await db.delete(sizeCategories).where(eq(sizeCategories.id, categoryId));

    // Revalidate relevant paths
    revalidatePath('/dashboard/attributes/sizes');

    return { success: true };
  } catch (error) {
    console.error("Error deleting size category:", error);
    return {
      success: false,
      error: "Failed to delete category. Please try again.",
    };
  }
}
