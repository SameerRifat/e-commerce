// src/lib/actions/color-management.ts
"use server";

import { db } from "@/lib/db";
import { colors, productVariants, type InsertColor, type SelectColor } from "@/lib/db/schema";
import { colorFormSchema, type ColorFormData } from "@/lib/validations/dashboard";
import { eq, asc, ilike, or, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Types for server action responses
export type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Enhanced color type with variant count
export interface ColorWithStats extends SelectColor {
  variantCount: number;
}

// Pagination and search parameters
export interface ColorSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "slug" | "variantCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface PaginatedColors {
  colors: ColorWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Single optimized query for colors with search, pagination, and stats using window function
export async function getColors(params: ColorSearchParams = {}): Promise<PaginatedColors> {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "name",
      sortOrder = "asc",
    } = params;

    // Ensure valid page and limit values
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(limit, 100)); // Cap at 100
    const offset = (validPage - 1) * validLimit;

    // Build search conditions
    const searchCondition = search
      ? or(
        ilike(colors.name, `%${search}%`),
        ilike(colors.slug, `%${search}%`),
        ilike(colors.hexCode, `%${search}%`)
      )
      : undefined;

    // Build sort condition
    const getSortColumn = () => {
      switch (sortBy) {
        case "variantCount":
          return sql`variant_count`;
        case "name":
          return colors.name;
        case "slug":
          return colors.slug;
        default:
          return colors.name;
      }
    };

    const sortColumn = getSortColumn();
    const orderDirection = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

    // Single query with window function for total count
    const colorsResult = await db
      .select({
        id: colors.id,
        name: colors.name,
        slug: colors.slug,
        hexCode: colors.hexCode,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`.as('variant_count'),
        // Window function to get total count without separate query
        totalCount: sql<number>`cast(count(*) over() as integer)`.as('total_count'),
      })
      .from(colors)
      .leftJoin(productVariants, eq(colors.id, productVariants.colorId))
      .where(searchCondition)
      .groupBy(colors.id, colors.name, colors.slug, colors.hexCode)
      .orderBy(orderDirection)
      .limit(validLimit)
      .offset(offset);

    // Handle edge case when offset is too high (no results returned)
    let total = 0;
    if (colorsResult.length > 0) {
      total = colorsResult[0].totalCount;
    } else if (validPage > 1) {
      // If no results but we're not on page 1, get total count separately
      const countResult = await db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
        })
        .from(colors)
        .leftJoin(productVariants, eq(colors.id, productVariants.colorId))
        .where(searchCondition)
        .groupBy(colors.id, colors.name, colors.slug, colors.hexCode);

      total = countResult.length;
    }

    const totalPages = Math.ceil(total / validLimit);

    return {
      colors: colorsResult.map(({ totalCount: _, ...color }) => ({
        ...color,
        variantCount: Number(color.variantCount),
      })),
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching colors:", error);
    return {
      colors: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// Optimized single color fetch
export async function getColorById(colorId: string): Promise<SelectColor | null> {
  try {
    const result = await db
      .select({
        id: colors.id,
        name: colors.name,
        slug: colors.slug,
        hexCode: colors.hexCode,
      })
      .from(colors)
      .where(eq(colors.id, colorId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching color by ID:", error);
    return null;
  }
}

// Optimized batch validation with single query
export async function validateColorData(
  data: ColorFormData,
  excludeColorId?: string
): Promise<ActionResult> {
  // Schema validation first
  const schemaValidation = colorFormSchema.safeParse(data);
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

  // Single database query for all validations
  try {
    const validationQuery = await db
      .select({
        id: colors.id,
        slug: colors.slug,
      })
      .from(colors)
      .where(eq(colors.slug, data.slug));

    // Check slug uniqueness
    const existingColor = validationQuery.find(color =>
      color.slug === data.slug && color.id !== excludeColorId
    );

    if (existingColor) {
      return {
        success: false,
        error: "Business validation failed",
        fieldErrors: {
          slug: ['Slug must be unique']
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error validating color data:", error);
    return {
      success: false,
      error: "Validation failed. Please try again.",
    };
  }
}

// Optimized create with single transaction
export async function createColor(data: ColorFormData): Promise<ActionResult<{ colorId: string }>> {
  try {
    // Server-side validation
    const validation = await validateColorData(data);
    if (!validation.success) {
      return validation as ActionResult<{ colorId: string }>;
    }

    // Single transaction for creation
    const [createdColor] = await db
      .insert(colors)
      .values({
        name: data.name,
        slug: data.slug,
        hexCode: data.hexCode,
      } satisfies InsertColor)
      .returning({ id: colors.id });

    // Batch revalidate
    revalidatePath('/dashboard/attributes/colors');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { colorId: createdColor.id },
    };
  } catch (error) {
    console.error("Error creating color:", error);
    return {
      success: false,
      error: "Failed to create color. Please try again.",
    };
  }
}

// Optimized update with existence check in validation
export async function updateColor(
  colorId: string,
  data: ColorFormData
): Promise<ActionResult<{ colorId: string }>> {
  try {
    // Combined validation and existence check
    const validation = await validateColorData(data, colorId);
    if (!validation.success) {
      return validation as ActionResult<{ colorId: string }>;
    }

    // Check existence and update in single query pattern
    const updateResult = await db
      .update(colors)
      .set({
        name: data.name,
        slug: data.slug,
        hexCode: data.hexCode,
      } satisfies Partial<InsertColor>)
      .where(eq(colors.id, colorId))
      .returning({ id: colors.id });

    if (updateResult.length === 0) {
      return {
        success: false,
        error: "Color not found.",
      };
    }

    // Batch revalidate
    revalidatePath('/dashboard/attributes/colors');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { colorId },
    };
  } catch (error) {
    console.error("Error updating color:", error);
    return {
      success: false,
      error: "Failed to update color. Please try again.",
    };
  }
}

// Optimized delete with single constraint check query
export async function deleteColor(colorId: string): Promise<ActionResult> {
  try {
    // Single query to check both existence and constraints
    const constraintCheck = await db
      .select({
        colorExists: sql<boolean>`case when colors.id is not null then true else false end`,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`,
      })
      .from(colors)
      .leftJoin(productVariants, eq(colors.id, productVariants.colorId))
      .where(eq(colors.id, colorId))
      .groupBy(colors.id);

    const result = constraintCheck[0];

    if (!result?.colorExists) {
      return {
        success: false,
        error: "Color not found.",
      };
    }

    if (result.variantCount > 0) {
      return {
        success: false,
        error: "Cannot delete color with associated product variants. Please reassign or delete variants first.",
      };
    }

    // Proceed with deletion
    await db.delete(colors).where(eq(colors.id, colorId));

    // Batch revalidate
    revalidatePath('/dashboard/attributes/colors');
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error("Error deleting color:", error);
    return {
      success: false,
      error: "Failed to delete color. Please try again.",
    };
  }
}

// Form submission actions remain unchanged (they use the optimized functions above)
export async function submitColorForm(data: ColorFormData): Promise<never> {
  const result = await createColor(data);

  if (result.success) {
    redirect('/dashboard/attributes/colors?success=created');
  } else {
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');

    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }

    redirect(`/dashboard/attributes/colors/new?${errorParams.toString()}`);
  }
}

export async function submitColorUpdateForm(colorId: string, data: ColorFormData): Promise<never> {
  const result = await updateColor(colorId, data);

  if (result.success) {
    redirect('/dashboard/attributes/colors?success=updated');
  } else {
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');

    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }

    redirect(`/dashboard/attributes/colors/${colorId}/edit?${errorParams.toString()}`);
  }
}