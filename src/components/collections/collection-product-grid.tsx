// src/components/collections/collection-product-grid.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/shared/product-card";
import ProductGrid from "@/components/shared/product-grid";
import { LoadMoreButton } from "@/components/products/load-more-button";
import { getCollectionProductsWithFilters, type CollectionProduct } from "@/lib/actions/collections-filtered";
import { parseFilterParams, type NormalizedProductFilters } from "@/lib/utils/query";

interface CollectionProductGridProps {
    initialProducts: CollectionProduct[];
    totalCount: number;
    hasMore: boolean;
    collectionSlug: string;
    currentPage: number;
    currentSort: "featured" | "price_asc" | "price_desc" | "newest";
    filters: NormalizedProductFilters;
}

export function CollectionProductGrid({
    initialProducts,
    totalCount,
    hasMore: initialHasMore,
    collectionSlug,
    currentPage,
    currentSort,
    filters,
}: CollectionProductGridProps) {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState<CollectionProduct[]>(initialProducts);
    const [page, setPage] = useState(currentPage);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Reset products when filters change (matches ProductGridClient pattern)
    useEffect(() => {
        setProducts(initialProducts);
        setPage(currentPage);
        setHasMore(initialHasMore);
        setError(null);
    }, [initialProducts, filters, currentPage, initialHasMore]);

    const handleLoadMore = () => {
        const nextPage = page + 1;

        startTransition(async () => {
            try {
                setError(null);

                // Parse current filters from URL
                const sp: Record<string, string | string[] | undefined> = {};
                searchParams.forEach((value, key) => {
                    const existing = sp[key];
                    if (existing === undefined) {
                        sp[key] = value;
                    } else if (Array.isArray(existing)) {
                        existing.push(value);
                    } else {
                        sp[key] = [existing, value];
                    }
                });

                const filters = parseFilterParams(sp);
                filters.page = nextPage;
                filters.sort = currentSort;

                const data = await getCollectionProductsWithFilters(
                    collectionSlug,
                    filters
                );

                if (data && data.products.length > 0) {
                    setProducts((prev) => [...prev, ...data.products]);
                    setPage(nextPage);
                    setHasMore(data.hasMore);
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to load more products";
                setError(errorMessage);
            }
        });
    };

    return (
        <div>
            {/* Product Grid */}
            <ProductGrid>
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        id={product.id}
                        slug={product.slug}
                        title={product.name}
                        imageSrc={product.imageUrl ?? "/products/product-1.jpg"}
                        hoverImageSrc={product.hoverImageUrl}
                        price={product.price ?? undefined}
                        salePrice={product.salePrice}
                        discountPercentage={product.discountPercentage}
                        href={`/products/${product.slug}`}
                        averageRating={product.averageRating}
                        reviewCount={product.reviewCount}
                    />
                ))}
            </ProductGrid>

            {/* Error Message */}
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
                    <p className="text-sm text-destructive">{error}</p>
                </div>
            )}

            {/* Load More Button */}
            {hasMore && (
                <LoadMoreButton
                    onClick={handleLoadMore}
                    isPending={isPending}
                    disabled={false}
                />
            )}
        </div>
    );
}