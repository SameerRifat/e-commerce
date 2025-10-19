// src/components/profile/orders/review-form.tsx
'use client';

import { useState } from 'react';
import { Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createReview, updateReview } from '@/lib/actions/reviews';

interface ReviewFormProps {
    productId: string;
    productName: string;
    existingReview?: {
        id: string;
        rating: number;
        comment: string | null;
    };
    onSuccess?: (updatedReview: {
        id: string;
        rating: number;
        comment: string | null;
    }) => void;
    onCancel?: () => void;
}

export function ReviewForm({
    productId,
    productName,
    existingReview,
    onSuccess,
    onCancel,
}: ReviewFormProps) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEditing = !!existingReview;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        const trimmedComment = comment.trim();
        if (trimmedComment.length < 10) {
            setError('Please write at least 10 characters');
            return;
        }

        if (trimmedComment.length > 1000) {
            setError('Review must not exceed 1000 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            let result;
            
            if (isEditing) {
                result = await updateReview({
                    reviewId: existingReview.id,
                    rating,
                    comment: trimmedComment,
                });
            } else {
                result = await createReview({
                    productId,
                    rating,
                    comment: trimmedComment,
                });
            }

            if (result.success && result.review) {
                // ✅ FIX: Pass the updated review data back to parent
                // Extract only the fields that ReviewsList expects
                onSuccess?.({
                    id: result.review.id,
                    rating: result.review.rating,
                    comment: result.review.comment,
                });
            } else {
                setError(result.error || 'Failed to submit review. Please try again.');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ratingLabels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent',
    };

    const isFormValid = rating > 0 && comment.trim().length >= 10 && comment.trim().length <= 1000;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Name */}
            <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-900">{productName}</p>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                    Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            >
                                <Star
                                    className={`w-8 h-8 transition-colors ${
                                        star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {(hoveredRating || rating) > 0 && (
                        <span className="text-sm font-medium text-gray-700">
                            {ratingLabels[(hoveredRating || rating) as keyof typeof ratingLabels]}
                        </span>
                    )}
                </div>
            </div>

            {/* Review Comment */}
            <div className="space-y-2">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-900">
                    Your Review <span className="text-red-500">*</span>
                </label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product... (minimum 10 characters)"
                    rows={5}
                    className="resize-none"
                    maxLength={1000}
                    disabled={isSubmitting}
                />
                <div className="flex justify-between text-xs">
                    <span className={comment.trim().length < 10 ? 'text-red-500' : 'text-gray-500'}>
                        {comment.trim().length < 10 
                            ? `${10 - comment.trim().length} more characters needed`
                            : 'Minimum requirement met'
                        }
                    </span>
                    <span className={comment.length > 950 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {comment.length}/1000
                    </span>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <Button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="flex-1"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {isEditing ? 'Updating...' : 'Submitting...'}
                        </>
                    ) : (
                        <>{isEditing ? 'Update Review' : 'Submit Review'}</>
                    )}
                </Button>
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                )}
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-medium mb-2">Review Guidelines:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Share your honest experience with the product</li>
                    <li>Focus on product features, quality, and performance</li>
                    <li>Be respectful and avoid inappropriate language</li>
                    <li>Your review helps other customers make informed decisions</li>
                </ul>
            </div>
        </form>
    );
}