// src/components/products/product-detail/reviews-section.tsx
import CollapsibleSection from "@/components/CollapsibleSection";
import { getProductReviews, checkUserReviewEligibility } from "@/lib/actions/reviews";
import { getCurrentUser } from "@/lib/auth/actions";
import { Star } from "lucide-react";
import { ReviewsHeader } from "./reviews-header";
import { WriteReviewButton } from "./write-review-button";
import { ReviewsList } from "./reviews-list";

interface ReviewsSectionProps {
  productId: string;
  productName?: string;
  productSlug?: string;
}

export default async function ReviewsSection({
  productId,
  productName,
  productSlug,
}: ReviewsSectionProps) {
  // Get current user
  const user = await getCurrentUser();

  // ✅ FIX: Fetch initial reviews with same limit as ReviewsList expects
  const result = await getProductReviews(productId, {
    page: 1,
    limit: 1, // Set to 1 for testing pagination
    sortBy: "recent",
  });

  if (!result.success) {
    return (
      <CollapsibleSection title="Reviews" value="reviews">
        <div className="text-center py-8 text-gray-500">
          <p className="text-body">Failed to load reviews.</p>
        </div>
      </CollapsibleSection>
    );
  }

  const { reviews = [], stats, pagination } = result;
  const totalReviews = stats?.totalReviews || 0;
  const averageRating = stats?.averageRating || 0;

  // Always check eligibility if user is authenticated
  let userEligibility = null;
  if (user) {
    const eligibilityResult = await checkUserReviewEligibility(productId);
    if (eligibilityResult.success) {
      userEligibility = eligibilityResult.eligibility;
    }
  }

  // Only show Write button if user hasn't reviewed yet
  const shouldShowWriteButton = !!(user &&
    productId &&
    productName &&
    userEligibility &&
    userEligibility.canReview &&
    !userEligibility.hasReview);

  return (
    <CollapsibleSection
      title={`Reviews (${totalReviews})`}
      value="reviews"
      rightMeta={
        totalReviews > 0 && (
          <span className="flex items-center gap-1 text-dark-900">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-300 text-gray-300"
                }`}
              />
            ))}
          </span>
        )
      }
    >
      <div className="space-y-6">
        {/* Reviews Header with Stats */}
        {totalReviews > 0 && stats && (
          <ReviewsHeader stats={stats} />
        )}

        {/* Write Review Button */}
        {shouldShowWriteButton && userEligibility && (
          <WriteReviewButton
            productId={productId}
            productName={productName}
            productSlug={productSlug}
            eligibility={userEligibility}
          />
        )}

        {/* Reviews List or Empty State */}
        {totalReviews === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-body">No reviews yet.</p>
            <p className="text-caption mt-2">
              Be the first to review this product!
            </p>
          </div>
        ) : (
          pagination && (
            <ReviewsList
              productId={productId}
              productName={productName || "this product"}
              initialReviews={reviews}
              initialPagination={pagination}
              currentUserId={user?.id}
            />
          )
        )}
      </div>
    </CollapsibleSection>
  );
}