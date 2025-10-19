// src/components/products/product-detail/reviews-header.tsx
'use client';

import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ProductReviewStats } from '@/lib/actions/reviews';

interface ReviewsHeaderProps {
    stats: ProductReviewStats;
}

export function ReviewsHeader({ stats }: ReviewsHeaderProps) {
    const { averageRating, totalReviews, ratingDistribution } = stats;

    // Calculate percentages for rating bars
    const getPercentage = (count: number) => {
        if (totalReviews === 0) return 0;
        return Math.round((count / totalReviews) * 100);
    };

    return (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100/50">
            <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Average Rating */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                            {averageRating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star
                                    key={i}
                                    className={`h-5 w-5 ${i <= Math.round(averageRating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'fill-gray-300 text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                        <p className="text-sm text-gray-600">
                            Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Rating Distribution */}
                    <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                            const percentage = getPercentage(count);

                            return (
                                <div key={rating} className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 w-16 text-sm text-gray-700">
                                        <span>{rating}</span>
                                        <Star className="h-3 w-3 fill-gray-400 text-gray-400" />
                                    </div>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-600 w-12 text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}