// src/lib/actions/reviews.ts
"use server";

import { db } from "@/lib/db";
import {
  reviews,
  products,
  users,
  orders,
  orderItems,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createReviewSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review must not exceed 1000 characters"),
});

const updateReviewSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(1000, "Review must not exceed 1000 characters"),
});

// ============================================================================
// UNIFIED TYPES
// ============================================================================

export type ReviewUser = {
  id: string;
  name: string;
  image: string | null;
};

export type ProductReview = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: ReviewUser;
  isVerifiedPurchase: boolean;
};

export type ProductReviewStats = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
};

export type ReviewsPaginationResult = {
  success: boolean;
  reviews?: ProductReview[];
  stats?: ProductReviewStats;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
  };
  error?: string;
};

// ✅ NEW: User review eligibility type
export type UserReviewEligibility = {
  canReview: boolean;
  hasReview: boolean;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  reason?: 'not_purchased' | 'not_delivered' | 'already_reviewed' | null;
};

// ============================================================================
// ✅ NEW: CHECK USER REVIEW ELIGIBILITY (Optimized - Single Query!)
// ============================================================================

/**
 * Check if user is eligible to review a product
 * Requirements:
 * 1. Must be authenticated
 * 2. Must have purchased the product (order with delivered status)
 * 3. Can only have one review per product
 * 
 * Returns eligibility status and existing review if any
 */
export async function checkUserReviewEligibility(
  productId: string
): Promise<{
  success: boolean;
  eligibility?: UserReviewEligibility;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: true,
        eligibility: {
          canReview: false,
          hasReview: false,
          reason: null,
        },
      };
    }

    // ✅ OPTIMIZED: Two separate checks for clarity and correctness
    
    // Check 1: Does user have an existing review?
    const [existingReviewData] = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.productId, productId),
          eq(reviews.userId, user.id)
        )
      )
      .limit(1);

    const hasReview = !!existingReviewData;
    const existingReview = hasReview
      ? {
          id: existingReviewData.id,
          rating: existingReviewData.rating,
          comment: existingReviewData.comment,
        }
      : undefined;

    // Check 2: Does user have a delivered order for this product?
    const [deliveredOrderData] = await db
      .select({
        orderId: orders.id,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(
        and(
          eq(orders.userId, user.id),
          eq(orderItems.productId, productId),
          eq(orders.status, 'delivered')
        )
      )
      .limit(1);

    const hasDeliveredOrder = !!deliveredOrderData;

    // Determine eligibility based on both checks
    let canReview = false;
    let reason: UserReviewEligibility['reason'] = null;

    if (hasReview) {
      // User already reviewed - they can edit it
      canReview = true;
      reason = 'already_reviewed';
    } else if (!hasDeliveredOrder) {
      // User hasn't received the product (or hasn't ordered at all)
      canReview = false;
      reason = 'not_delivered';
    } else {
      // User has delivered order but no review - can write new review
      canReview = true;
      reason = null;
    }

    return {
      success: true,
      eligibility: {
        canReview,
        hasReview,
        existingReview,
        reason,
      },
    };
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return {
      success: false,
      error: "Failed to check review eligibility.",
    };
  }
}

// ============================================================================
// CREATE REVIEW (Enhanced with eligibility check)
// ============================================================================

export async function createReview(data: {
  productId: string;
  rating: number;
  comment?: string;
}): Promise<{
  success: boolean;
  review?: ProductReview;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to submit a review.",
      };
    }

    // Validate input
    const validation = createReviewSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const { productId, rating, comment } = validation.data;

    // ✅ Check eligibility (includes delivered order check)
    const eligibilityResult = await checkUserReviewEligibility(productId);
    
    if (!eligibilityResult.success) {
      return {
        success: false,
        error: eligibilityResult.error || "Failed to verify eligibility.",
      };
    }

    const { eligibility } = eligibilityResult;

    if (!eligibility?.canReview) {
      if (eligibility?.reason === 'not_delivered') {
        return {
          success: false,
          error: "You can only review products that have been delivered to you.",
        };
      }
      return {
        success: false,
        error: "You are not eligible to review this product.",
      };
    }

    if (eligibility.hasReview) {
      return {
        success: false,
        error: "You have already reviewed this product. You can edit your existing review.",
      };
    }

    // Get product slug for revalidation
    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return {
        success: false,
        error: "Product not found.",
      };
    }

    // Create the review
    const [newReview] = await db
      .insert(reviews)
      .values({
        productId,
        userId: user.id,
        rating,
        comment: comment || null,
      })
      .returning();

    // Get user details for the response
    const [userData] = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Revalidate relevant pages
    revalidatePath(`/products/${product.slug}`);
    revalidatePath(`/products`);
    revalidatePath(`/profile/orders`);

    return {
      success: true,
      review: {
        id: newReview.id,
        productId: newReview.productId,
        userId: newReview.userId,
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: newReview.createdAt,
        user: {
          id: userData.id,
          name: userData.name || "Anonymous",
          image: userData.image,
        },
        isVerifiedPurchase: true, // Always true since we checked eligibility
      },
    };
  } catch (error) {
    console.error("Error creating review:", error);
    return {
      success: false,
      error: "Failed to submit review. Please try again.",
    };
  }
}

// ============================================================================
// UPDATE REVIEW (Enhanced with eligibility check)
// ============================================================================

export async function updateReview(data: {
  reviewId: string;
  rating: number;
  comment?: string;
}): Promise<{
  success: boolean;
  review?: ProductReview;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to update a review.",
      };
    }

    // Validate input
    const validation = updateReviewSchema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.issues[0].message,
      };
    }

    const { reviewId, rating, comment } = validation.data;

    // Check if review exists and belongs to user
    const [existingReview] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        productId: reviews.productId,
      })
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!existingReview) {
      return {
        success: false,
        error: "Review not found.",
      };
    }

    if (existingReview.userId !== user.id) {
      return {
        success: false,
        error: "You can only update your own reviews.",
      };
    }

    // Update the review
    const [updatedReview] = await db
      .update(reviews)
      .set({
        rating,
        comment: comment || null,
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    // Get user details
    const [userData] = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Get product slug for revalidation
    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, existingReview.productId))
      .limit(1);

    // Revalidate relevant pages
    if (product) {
      revalidatePath(`/products/${product.slug}`);
    }
    revalidatePath(`/products`);
    revalidatePath(`/profile/orders`);

    return {
      success: true,
      review: {
        id: updatedReview.id,
        productId: updatedReview.productId,
        userId: updatedReview.userId,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        createdAt: updatedReview.createdAt,
        user: {
          id: userData.id,
          name: userData.name || "Anonymous",
          image: userData.image,
        },
        isVerifiedPurchase: true,
      },
    };
  } catch (error) {
    console.error("Error updating review:", error);
    return {
      success: false,
      error: "Failed to update review. Please try again.",
    };
  }
}

// ============================================================================
// GET USER'S REVIEW FOR A PRODUCT (Kept for backward compatibility)
// ============================================================================

export async function getUserProductReview(productId: string): Promise<{
  success: boolean;
  review?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to check reviews.",
      };
    }

    if (!productId || typeof productId !== "string") {
      return {
        success: false,
        error: "Invalid product ID.",
      };
    }

    const [existingReview] = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, user.id)))
      .limit(1);

    if (!existingReview) {
      return {
        success: true,
        review: undefined,
      };
    }

    return {
      success: true,
      review: {
        id: existingReview.id,
        rating: existingReview.rating,
        comment: existingReview.comment,
      },
    };
  } catch (error) {
    console.error("Error fetching user product review:", error);
    return {
      success: false,
      error: "Failed to check review status. Please try again.",
    };
  }
}

// ============================================================================
// DELETE REVIEW
// ============================================================================

export async function deleteReview(reviewId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "You must be signed in to delete a review.",
      };
    }

    // Check if review exists and belongs to user
    const [existingReview] = await db
      .select({
        userId: reviews.userId,
        productId: reviews.productId,
      })
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!existingReview) {
      return {
        success: false,
        error: "Review not found.",
      };
    }

    if (existingReview.userId !== user.id) {
      return {
        success: false,
        error: "You can only delete your own reviews.",
      };
    }

    // Get product slug before deletion
    const [product] = await db
      .select({ slug: products.slug })
      .from(products)
      .where(eq(products.id, existingReview.productId))
      .limit(1);

    // Delete the review
    await db.delete(reviews).where(eq(reviews.id, reviewId));

    // Revalidate relevant pages
    if (product) {
      revalidatePath(`/products/${product.slug}`);
    }
    revalidatePath(`/products`);
    revalidatePath(`/profile/orders`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting review:", error);
    return {
      success: false,
      error: "Failed to delete review. Please try again.",
    };
  }
}

// ============================================================================
// ✅ OPTIMIZED: Get product reviews with single query for verified purchases
// ============================================================================

export async function getProductReviews(
  productId: string,
  options: {
    page?: number;
    limit?: number;
    sortBy?: "recent" | "rating_high" | "rating_low";
  } = {}
): Promise<ReviewsPaginationResult> {
  try {
    const { page = 1, limit = 10, sortBy = "recent" } = options;
    const offset = (page - 1) * limit;

    // Validate productId
    if (!productId || typeof productId !== "string") {
      return {
        success: false,
        error: "Invalid product ID.",
      };
    }

    // Get total count and stats
    const [statsResult] = await db
      .select({
        totalReviews: sql<number>`cast(count(${reviews.id}) as int)`,
        averageRating: sql<number>`cast(coalesce(avg(${reviews.rating}), 0) as decimal(3,2))`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    const totalReviews = Number(statsResult?.totalReviews || 0);
    const averageRating = Number(statsResult?.averageRating || 0);

    // If no reviews, return early
    if (totalReviews === 0) {
      return {
        success: true,
        reviews: [],
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalReviews: 0,
          hasMore: false,
        },
      };
    }

    // Get rating distribution
    const distributionResults = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .groupBy(reviews.rating);

    const ratingDistribution: ProductReviewStats["ratingDistribution"] = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    distributionResults.forEach((item) => {
      ratingDistribution[item.rating as keyof typeof ratingDistribution] =
        Number(item.count);
    });

    // ✅ FIX: Use subquery to check verified purchase status without duplicating reviews
    // First, get all reviews with user info
    let query = db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        userId: reviews.userId,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        userName: users.name,
        userImage: users.image,
      })
      .from(reviews)
      .innerJoin(users, eq(users.id, reviews.userId))
      .where(eq(reviews.productId, productId))
      .limit(limit)
      .offset(offset)
      .$dynamic();

    // Apply sorting
    if (sortBy === "rating_high") {
      query = query.orderBy(desc(reviews.rating), desc(reviews.createdAt));
    } else if (sortBy === "rating_low") {
      query = query.orderBy(reviews.rating, desc(reviews.createdAt));
    } else {
      query = query.orderBy(desc(reviews.createdAt));
    }

    const reviewsData = await query;

    // ✅ FIX: Check verified purchase status separately to avoid JOIN duplicates
    const userIds = reviewsData.map(r => r.userId);
    
    // Get all users who have delivered orders for this product
    const verifiedUserIds = new Set<string>();
    
    if (userIds.length > 0) {
      const verifiedUsers = await db
        .selectDistinct({ userId: orders.userId })
        .from(orders)
        .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
        .where(
          and(
            inArray(orders.userId, userIds),
            eq(orderItems.productId, productId),
            eq(orders.status, 'delivered')
          )
        );

      verifiedUsers.forEach(row => {
        if (row.userId) verifiedUserIds.add(row.userId);
      });
    }

    // Format reviews with verified purchase status
    const formattedReviews: ProductReview[] = reviewsData.map((review) => ({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        id: review.userId,
        name: review.userName || "Anonymous",
        image: review.userImage,
      },
      isVerifiedPurchase: verifiedUserIds.has(review.userId),
    }));

    const totalPages = Math.ceil(totalReviews / limit);
    const hasMore = page < totalPages;

    return {
      success: true,
      reviews: formattedReviews,
      stats: {
        averageRating,
        totalReviews,
        ratingDistribution,
      },
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews,
        hasMore,
      },
    };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return {
      success: false,
      error: "Failed to load reviews. Please try again.",
    };
  }
}