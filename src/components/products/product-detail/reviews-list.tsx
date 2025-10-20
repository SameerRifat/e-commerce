// src/components/products/product-detail/reviews-list.tsx - DEBUG VERSION
'use client';

import { useState, useRef, useEffect } from 'react';
import { Star, Loader2, ChevronDown, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProductReviews, deleteReview, type ProductReview } from '@/lib/actions/reviews';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ReviewDialog } from '@/components/profile/orders/review-dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReviewsListProps {
  productId: string;
  productName: string;
  initialReviews: ProductReview[];
  initialPagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
  };
  currentUserId?: string | null;
}

export function ReviewsList({
  productId,
  productName,
  initialReviews,
  initialPagination,
  currentUserId,
}: ReviewsListProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [hasMore, setHasMore] = useState(initialPagination.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Edit review state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<{
    id: string;
    rating: number;
    comment: string | null;
  } | null>(null);

  // Delete review state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const deletePromiseRef = useRef<Promise<void> | null>(null);

  // Sync local state with server updates (from router.refresh())
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      
      const result = await getProductReviews(productId, {
        page: nextPage,
        limit: 1, // Match your test limit
        sortBy: 'recent',
      });

      if (result.success && result.reviews) {
        setReviews((prev) => [...prev, ...result.reviews!]);
        setCurrentPage(nextPage);
        setHasMore(result.pagination?.hasMore || false);
      } else {
        toast.error(result.error || 'Failed to load more reviews');
      }
    } catch (error) {
      console.error('Error loading more reviews:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleEditClick = (review: ProductReview) => {
    setEditingReview({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = (updatedReview: {
    id: string;
    rating: number;
    comment: string | null;
  }) => {
    setIsEditDialogOpen(false);
    
    setReviews((prev) =>
      prev.map((review) =>
        review.id === updatedReview.id
          ? {
              ...review,
              rating: updatedReview.rating,
              comment: updatedReview.comment,
            }
          : review
      )
    );
    
    setEditingReview(null);
    toast.success('Review updated successfully!');
    router.refresh();
  };

  const handleDeleteClick = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingReviewId) return;

    setIsDeleting(true);

    const deletePromise = (async () => {
      try {
        const result = await deleteReview(deletingReviewId);

        if (result.success) {
          toast.success('Review deleted successfully');
          setReviews((prev) => prev.filter((review) => review.id !== deletingReviewId));
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to delete review');
        }
      } catch (error) {
        console.error('Error deleting review:', error);
        toast.error('An unexpected error occurred');
      } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setDeletingReviewId(null);
      }
    })();

    deletePromiseRef.current = deletePromise;
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && isDeleting) {
      return;
    }
    setIsDeleteDialogOpen(open);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };


  return (
    <>
      <div className="space-y-4">
        {/* Reviews List */}
        <ul className="space-y-4">
          {reviews.map((review) => {
            const isOwnReview = currentUserId && review.userId === currentUserId;
            const isDeletingThisReview = deletingReviewId === review.id && isDeleting;

            return (
              <li key={review.id}>
                <Card
                  className={`shadow-sm hover:shadow-md transition-all ${
                    isDeletingThisReview ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <CardContent>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={review.user.image || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700">
                            {getInitials(review.user.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-body-medium font-semibold text-dark-900">
                              {review.user.name}
                            </p>
                            {review.isVerifiedPurchase && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-green-100 text-green-800 hover:bg-green-100"
                              >
                                ✓ Verified Purchase
                              </Badge>
                            )}
                            {isOwnReview && (
                              <Badge
                                variant="outline"
                                className="text-xs border-primary text-primary"
                              >
                                Your Review
                              </Badge>
                            )}
                          </div>
                          <p className="text-caption text-gray-500 mt-0.5">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'fill-gray-300 text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.comment && (
                      <div className="text-body text-dark-700 whitespace-pre-wrap mb-3">
                        {review.comment}
                      </div>
                    )}

                    {isOwnReview && (
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(review)}
                          className="gap-2"
                          disabled={isDeleting}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit Review
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(review.id)}
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              size="lg"
              className="gap-2"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading more reviews...
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Load More Reviews
                </>
              )}
            </Button>
          </div>
        )}

        {/* Reviews Count Info */}
        {!hasMore && reviews.length > 5 && (
          <div className="text-center pt-4">
            <p className="text-caption text-gray-500">
              You&apos;ve reached the end • Showing all {reviews.length} reviews
            </p>
          </div>
        )}
      </div>

      {/* Edit Review Dialog */}
      {editingReview && (
        <ReviewDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          productId={productId}
          productName={productName}
          existingReview={editingReview}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDeleteDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>

            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Review'
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}