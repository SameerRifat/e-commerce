// src/components/products/product-detail/write-review-button.tsx
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewDialog } from '@/components/profile/orders/review-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { UserReviewEligibility } from '@/lib/actions/reviews';

interface WriteReviewButtonProps {
  productId: string;
  productName: string;
  productSlug?: string;
  eligibility: UserReviewEligibility;
}

export function WriteReviewButton({
  productId,
  productName,
  productSlug,
  eligibility,
}: WriteReviewButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleOpenDialog = () => {
    if (!eligibility.canReview) {
      // Show appropriate message based on reason
      if (eligibility.reason === 'not_delivered') {
        toast.info(
          'You can write a review after your order has been delivered.',
          {
            description: 'Check your orders page to track your delivery.',
            action: {
              label: 'View Orders',
              onClick: () => router.push('/profile/orders'),
            },
          }
        );
      } else {
        toast.info('You need to purchase this product before reviewing it.', {
          description: 'Add this product to your cart to get started.',
        });
      }
      return;
    }

    // User is eligible - open dialog immediately
    setIsDialogOpen(true);
  };

  // ✅ FIX: Optimistic update - hide button immediately after submission
  const handleReviewSuccess = (updatedReview: {
    id: string;
    rating: number;
    comment: string | null;
  }) => {
    setIsDialogOpen(false);
    setHasSubmitted(true); // Hide button immediately
    
    toast.success('Review submitted successfully! Thank you for your feedback.');

    // Refresh server components to show new review in list
    router.refresh();
  };

  // ✅ Don't show button if user hasn't purchased or if already submitted
  if (!eligibility.canReview && eligibility.reason === 'not_delivered') {
    return null;
  }

  // ✅ Hide button after successful submission (optimistic UI)
  if (hasSubmitted) {
    return null;
  }

  // ✅ Only show "Write a Review" - never "Edit Your Review"
  // Edit functionality is available in the review card itself
  return (
    <>
      <div className="flex justify-center">
        <Button
          onClick={handleOpenDialog}
          size="lg"
          className="gap-2"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </Button>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productId={productId}
        productName={productName}
        existingReview={undefined} // Never pass existing review - this is for NEW reviews only
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}