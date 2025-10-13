// src/components/products/product-detail/reviews-section.tsx
import CollapsibleSection from "@/components/CollapsibleSection";
import { getProductReviews, Review } from "@/lib/actions/product";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ReviewsSection({ productId }: { productId: string }) {
    const reviews: Review[] = await getProductReviews(productId);
    const count = reviews.length;
    const avg = count > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / count) : 0;

    return (
        <CollapsibleSection
            title={`Reviews (${count})`}
            value="reviews"
            rightMeta={
                <span className="flex items-center gap-1 text-dark-900">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(avg)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-300 text-gray-300"
                                }`}
                        />
                    ))}
                </span>
            }
        >
            {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-body">No reviews yet.</p>
                    <p className="text-caption mt-2">Be the first to review this product!</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {reviews.slice(0, 10).map((r) => (
                        <li key={r.id}>
                            <Card className="shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div>
                                            <p className="text-body-medium font-semibold text-dark-900">{r.author}</p>
                                            <p className="text-caption text-gray-500">
                                                {new Date(r.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-4 w-4 ${i <= r.rating
                                                            ? "fill-yellow-400 text-yellow-400"
                                                            : "fill-gray-300 text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {r.title && (
                                        <h4 className="text-body-medium font-semibold text-dark-900 mb-2">
                                            {r.title}
                                        </h4>
                                    )}

                                    {r.content && (
                                        <p className="text-body text-dark-700 line-clamp-[8]">
                                            {r.content}
                                        </p>
                                    )}

                                    {/* Verified Purchase Badge (if applicable) */}
                                    {/* {r.verified && (
                                        <div className="mt-3">
                                            <Badge variant="secondary" className="text-xs">
                                                ✓ Verified Purchase
                                            </Badge>
                                        </div>
                                    )} */}
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            )}

            {/* Show message if there are more reviews */}
            {reviews.length > 10 && (
                <div className="mt-6 text-center">
                    <p className="text-caption text-gray-500">
                        Showing 10 of {reviews.length} reviews
                    </p>
                </div>
            )}
        </CollapsibleSection>
    );
}