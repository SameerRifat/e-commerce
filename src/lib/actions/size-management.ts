// src/lib/actions/size-management.ts
"use server";

import { db } from "@/lib/db";
import { sizes, sizeCategories, productVariants, type InsertSize, type SelectSize } from "@/lib/db/schema";
import { sizeFormSchema, type SizeFormData } from "@/lib/validations/dashboard";
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

// Enhanced size type with variant count and category
export interface SizeWithStats extends SelectSize {
  variantCount: number;
  categoryName?: string;
}

// Size category overview type
export interface SizeCategoryOverview {
  id: string;
  name: string;
  sizeCount: number;
  sizes: Array<{
    id: string;
    name: string;
    variantCount: number;
  }>;
}

// Pagination and search parameters
export interface SizeSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "slug" | "sortOrder" | "variantCount";
  sortOrder?: "asc" | "desc";
  categoryId?: string;
}

export interface PaginatedSizes {
  sizes: SizeWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Get size categories overview - independent of pagination
export async function getSizeCategoriesOverview(): Promise<SizeCategoryOverview[]> {
  try {
    const categoriesResult = await db
      .select({
        categoryId: sizeCategories.id,
        categoryName: sql<string | null>`${sizeCategories.name}`,
        sizeId: sql<string | null>`${sizes.id}`,
        sizeName: sql<string | null>`${sizes.name}`,
        sortOrder: sizes.sortOrder,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`.as('variant_count'),
      })
      .from(sizeCategories)
      .leftJoin(sizes, eq(sizeCategories.id, sizes.categoryId))
      .leftJoin(productVariants, eq(sizes.id, productVariants.sizeId))
      .groupBy(sizeCategories.id, sizeCategories.name, sizes.id, sizes.name, sizes.sortOrder)
      .orderBy(asc(sizeCategories.name), asc(sizes.sortOrder));

    // Group by category
    const categoryMap = new Map<string, SizeCategoryOverview>();
    
    categoriesResult.forEach(row => {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, {
          id: row.categoryId,
          name: row.categoryName || 'Unknown Category',
          sizeCount: 0,
          sizes: [],
        });
      }
      
      const category = categoryMap.get(row.categoryId)!;
      
      if (row.sizeId && row.sizeName) {
        category.sizes.push({
          id: row.sizeId,
          name: row.sizeName,
          variantCount: Number(row.variantCount),
        });
        category.sizeCount++;
      }
    });

    // Handle uncategorized sizes
    const uncategorizedSizes = await db
      .select({
        sizeId: sizes.id,
        sizeName: sizes.name,
        sortOrder: sizes.sortOrder,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`.as('variant_count'),
      })
      .from(sizes)
      .leftJoin(productVariants, eq(sizes.id, productVariants.sizeId))
      .where(sql`${sizes.categoryId} IS NULL`)
      .groupBy(sizes.id, sizes.name, sizes.sortOrder)
      .orderBy(asc(sizes.sortOrder));

    if (uncategorizedSizes.length > 0) {
      categoryMap.set('uncategorized', {
        id: 'uncategorized',
        name: 'Uncategorized',
        sizeCount: uncategorizedSizes.length,
        sizes: uncategorizedSizes.map(size => ({
          id: size.sizeId,
          name: size.sizeName,
          variantCount: Number(size.variantCount),
        })),
      });
    }

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error("Error fetching size categories overview:", error);
    return [];
  }
}

// Single optimized query for sizes with search, pagination, and stats using window function
export async function getSizes(params: SizeSearchParams = {}): Promise<PaginatedSizes> {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "sortOrder",
      sortOrder = "asc",
      categoryId,
    } = params;

    // Ensure valid page and limit values
    const validPage = Math.max(1, page);
    const validLimit = Math.max(1, Math.min(limit, 100)); // Cap at 100
    const offset = (validPage - 1) * validLimit;

    // Build search conditions
    const searchConditions = [];
    
    if (search) {
      searchConditions.push(
        or(
          ilike(sizes.name, `%${search}%`),
          ilike(sizes.slug, `%${search}%`)
        )
      );
    }
    
    if (categoryId) {
      if (categoryId === 'uncategorized') {
        searchConditions.push(sql`${sizes.categoryId} IS NULL`);
      } else {
        searchConditions.push(eq(sizes.categoryId, categoryId));
      }
    }
    
    const searchCondition = searchConditions.length > 0 
      ? (searchConditions.length === 1 ? searchConditions[0] : sql.join(searchConditions, sql` AND `))
      : undefined;

    // Build sort condition
    const getSortColumn = () => {
      switch (sortBy) {
        case "variantCount":
          return sql`variant_count`;
        case "name":
          return sizes.name;
        case "slug":
          return sizes.slug;
        case "sortOrder":
          return sizes.sortOrder;
        default:
          return sizes.sortOrder;
      }
    };

    const sortColumn = getSortColumn();
    const orderDirection = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

    // Single query with window function for total count, including category information
    const sizesResult = await db
      .select({
        id: sizes.id,
        name: sizes.name,
        slug: sizes.slug,
        sortOrder: sizes.sortOrder,
        categoryId: sizes.categoryId,
        categoryName: sizeCategories.name,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`.as('variant_count'),
        // Window function to get total count without separate query
        totalCount: sql<number>`cast(count(*) over() as integer)`.as('total_count'),
      })
      .from(sizes)
      .leftJoin(sizeCategories, eq(sizes.categoryId, sizeCategories.id))
      .leftJoin(productVariants, eq(sizes.id, productVariants.sizeId))
      .where(searchCondition)
      .groupBy(sizes.id, sizes.name, sizes.slug, sizes.sortOrder, sizes.categoryId, sizeCategories.name)
      .orderBy(orderDirection)
      .limit(validLimit)
      .offset(offset);

    // Handle edge case when offset is too high (no results returned)
    let total = 0;
    if (sizesResult.length > 0) {
      total = sizesResult[0].totalCount;
    } else if (validPage > 1) {
      // If no results but we're not on page 1, get total count separately
      const countResult = await db
        .select({
          total: sql<number>`cast(count(*) as integer)`,
        })
        .from(sizes)
        .leftJoin(sizeCategories, eq(sizes.categoryId, sizeCategories.id))
        .leftJoin(productVariants, eq(sizes.id, productVariants.sizeId))
        .where(searchCondition)
        .groupBy(sizes.id, sizes.name, sizes.slug, sizes.sortOrder, sizes.categoryId, sizeCategories.name);
      
      total = countResult.length;
    }

    const totalPages = Math.ceil(total / validLimit);

    return {
      sizes: sizesResult.map(({ totalCount: _, ...size }) => ({
        ...size,
        variantCount: Number(size.variantCount),
        categoryName: size.categoryName || undefined,
      })),
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching sizes:", error);
    return {
      sizes: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// Optimized single size fetch
export async function getSizeById(sizeId: string): Promise<SelectSize | null> {
  try {
    const result = await db
      .select({
        id: sizes.id,
        name: sizes.name,
        slug: sizes.slug,
        sortOrder: sizes.sortOrder,
      })
      .from(sizes)
      .where(eq(sizes.id, sizeId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching size by ID:", error);
    return null;
  }
}

// Get next available sort order
export async function getNextSortOrder(): Promise<number> {
  try {
    const result = await db
      .select({
        maxSortOrder: sql<number>`cast(coalesce(max(${sizes.sortOrder}), 0) as integer)`,
      })
      .from(sizes);

    return (result[0]?.maxSortOrder || 0) + 1;
  } catch (error) {
    console.error("Error getting next sort order:", error);
    return 1;
  }
}

// Optimized batch validation with single query
export async function validateSizeData(
  data: SizeFormData, 
  excludeSizeId?: string
): Promise<ActionResult> {
  // Schema validation first
  const schemaValidation = sizeFormSchema.safeParse(data);
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
        id: sizes.id,
        slug: sizes.slug,
        sortOrder: sizes.sortOrder,
      })
      .from(sizes)
      .where(
        or(
          eq(sizes.slug, data.slug),
          eq(sizes.sortOrder, data.sortOrder)
        )
      );

    // Check slug uniqueness
    const existingSlugSize = validationQuery.find(size => 
      size.slug === data.slug && size.id !== excludeSizeId
    );

    if (existingSlugSize) {
      return {
        success: false,
        error: "Business validation failed",
        fieldErrors: {
          slug: ['Slug must be unique']
        },
      };
    }

    // Check sort order uniqueness
    const existingSortOrderSize = validationQuery.find(size => 
      size.sortOrder === data.sortOrder && size.id !== excludeSizeId
    );

    if (existingSortOrderSize) {
      return {
        success: false,
        error: "Business validation failed",
        fieldErrors: {
          sortOrder: ['Sort order must be unique']
        },
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error validating size data:", error);
    return {
      success: false,
      error: "Validation failed. Please try again.",
    };
  }
}

// Optimized create with single transaction
export async function createSize(data: SizeFormData): Promise<ActionResult<{ sizeId: string }>> {
  try {
    // If no sort order provided, get next available
    if (!data.sortOrder || data.sortOrder <= 0) {
      data.sortOrder = await getNextSortOrder();
    }

    // Server-side validation
    const validation = await validateSizeData(data);
    if (!validation.success) {
      return validation as ActionResult<{ sizeId: string }>;
    }

    // Single transaction for creation
    const [createdSize] = await db
      .insert(sizes)
      .values({
        name: data.name,
        slug: data.slug,
        sortOrder: data.sortOrder,
        categoryId: data.categoryId,
      } satisfies InsertSize)
      .returning({ id: sizes.id });

    // Batch revalidate
    revalidatePath('/dashboard/attributes/sizes');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { sizeId: createdSize.id },
    };
  } catch (error) {
    console.error("Error creating size:", error);
    return {
      success: false,
      error: "Failed to create size. Please try again.",
    };
  }
}

// Optimized update with existence check in validation
export async function updateSize(
  sizeId: string,
  data: SizeFormData
): Promise<ActionResult<{ sizeId: string }>> {
  try {
    // Combined validation and existence check
    const validation = await validateSizeData(data, sizeId);
    if (!validation.success) {
      return validation as ActionResult<{ sizeId: string }>;
    }

    // Check existence and update in single query pattern
    const updateResult = await db
      .update(sizes)
      .set({
        name: data.name,
        slug: data.slug,
        sortOrder: data.sortOrder,
        categoryId: data.categoryId,
      } satisfies Partial<InsertSize>)
      .where(eq(sizes.id, sizeId))
      .returning({ id: sizes.id });

    if (updateResult.length === 0) {
      return {
        success: false,
        error: "Size not found.",
      };
    }

    // Batch revalidate
    revalidatePath('/dashboard/attributes/sizes');
    revalidatePath('/dashboard/products');

    return {
      success: true,
      data: { sizeId },
    };
  } catch (error) {
    console.error("Error updating size:", error);
    return {
      success: false,
      error: "Failed to update size. Please try again.",
    };
  }
}

// Optimized delete with single constraint check query
export async function deleteSize(sizeId: string): Promise<ActionResult> {
  try {
    // Single query to check both existence and constraints
    const constraintCheck = await db
      .select({
        sizeExists: sql<boolean>`case when sizes.id is not null then true else false end`,
        variantCount: sql<number>`cast(coalesce(count(${productVariants.id}), 0) as integer)`,
      })
      .from(sizes)
      .leftJoin(productVariants, eq(sizes.id, productVariants.sizeId))
      .where(eq(sizes.id, sizeId))
      .groupBy(sizes.id);

    const result = constraintCheck[0];

    if (!result?.sizeExists) {
      return {
        success: false,
        error: "Size not found.",
      };
    }

    if (result.variantCount > 0) {
      return {
        success: false,
        error: "Cannot delete size with associated product variants. Please reassign or delete variants first.",
      };
    }

    // Proceed with deletion
    await db.delete(sizes).where(eq(sizes.id, sizeId));

    // Batch revalidate
    revalidatePath('/dashboard/attributes/sizes');
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error("Error deleting size:", error);
    return {
      success: false,
      error: "Failed to delete size. Please try again.",
    };
  }
}

// Bulk reorder sizes - for advanced sorting functionality
export async function reorderSizes(sizeOrders: { id: string; sortOrder: number }[]): Promise<ActionResult> {
  try {
    // Validate all size IDs exist
    const existingIds = await db
      .select({ id: sizes.id })
      .from(sizes)
      .where(
        sql`${sizes.id} = ANY(${sizeOrders.map(s => s.id)})`
      );

    if (existingIds.length !== sizeOrders.length) {
      return {
        success: false,
        error: "Some sizes were not found.",
      };
    }

    // Update all sort orders in a transaction
    await db.transaction(async (tx) => {
      for (const { id, sortOrder } of sizeOrders) {
        await tx
          .update(sizes)
          .set({ sortOrder })
          .where(eq(sizes.id, id));
      }
    });

    // Batch revalidate
    revalidatePath('/dashboard/attributes/sizes');
    revalidatePath('/dashboard/products');

    return { success: true };
  } catch (error) {
    console.error("Error reordering sizes:", error);
    return {
      success: false,
      error: "Failed to reorder sizes. Please try again.",
    };
  }
}

// Form submission actions remain unchanged (they use the optimized functions above)
export async function submitSizeForm(data: SizeFormData): Promise<never> {
  const result = await createSize(data);
  
  if (result.success) {
    redirect('/dashboard/attributes/sizes?success=created');
  } else {
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/attributes/sizes/new?${errorParams.toString()}`);
  }
}

export async function submitSizeUpdateForm(sizeId: string, data: SizeFormData): Promise<never> {
  const result = await updateSize(sizeId, data);
  
  if (result.success) {
    redirect('/dashboard/attributes/sizes?success=updated');
  } else {
    const errorParams = new URLSearchParams();
    errorParams.set('error', result.error || 'Unknown error');
    
    if (result.fieldErrors) {
      errorParams.set('fieldErrors', JSON.stringify(result.fieldErrors));
    }
    
    redirect(`/dashboard/attributes/sizes/${sizeId}/edit?${errorParams.toString()}`);
  }
}
