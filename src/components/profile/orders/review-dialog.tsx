// src/components/profile/orders/review-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReviewForm } from './review-form';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  };
  // ✅ FIX: Updated callback to receive the updated review data
  onSuccess?: (updatedReview: {
    id: string;
    rating: number;
    comment: string | null;
  }) => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  productId,
  productName,
  existingReview,
  onSuccess,
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {existingReview ? 'Edit Your Review' : 'Write a Review'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {existingReview 
              ? 'Update your review to reflect your current experience with this product.'
              : 'Share your experience to help other customers make informed decisions.'
            }
          </DialogDescription>
        </DialogHeader>
        <ReviewForm
          productId={productId}
          productName={productName}
          existingReview={existingReview}
          // ✅ FIX: Pass the updated review data up the chain
          onSuccess={onSuccess}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}