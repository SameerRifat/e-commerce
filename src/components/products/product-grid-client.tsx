// src/components/products/product-grid-client.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { NormalizedProductFilters } from "@/lib/utils/query";
import { fetchMoreProducts } from "@/lib/actions/product";
import ProductCard from "@/components/shared/product-card";
import { LoadMoreButton } from "./load-more-button";
import ProductGrid from "@/components/shared/product-grid";

type ProductListItem = {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    hoverImageUrl: string | null;
    price: number | null;
    salePrice: number | null;
    discountPercentage: number | null;
    createdAt: Date;
    averageRating: number | null;
    reviewCount: number;
};

interface ProductGridClientProps {
    initialProducts: ProductListItem[];
    totalCount: number;
    filters: NormalizedProductFilters;
}

export function ProductGridClient({
    initialProducts,
    totalCount,
    filters,
}: ProductGridClientProps) {
    const [products, setProducts] = useState<ProductListItem[]>(initialProducts);
    const [currentPage, setCurrentPage] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Reset pagination when filters change
    useEffect(() => {
        setProducts(initialProducts);
        setCurrentPage(1);
        setError(null);
    }, [initialProducts, filters]);

    const handleLoadMore = () => {
        const nextPage = currentPage + 1;

        startTransition(async () => {
            try {
                setError(null);
                const result = await fetchMoreProducts(filters, nextPage);

                // Only append new products if we got results
                if (result.products.length > 0) {
                    setProducts((prev) => [...prev, ...result.products]);
                    setCurrentPage(nextPage);
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to load more products";
                setError(errorMessage);
            }
        });
    };

    // Calculate if more products are available to load
    const itemsPerPage = filters.limit || 24;
    const loadedItems = products.length;
    const canLoadMore = loadedItems < totalCount;

    // Show empty state
    if (products.length === 0) {
        return (
            <div className="rounded-lg border border-border p-8 text-center">
                <p className="text-body text-foreground">
                    No products match your current filters.
                </p>
                <p className="text-body-small text-muted-foreground mt-2">
                    Try adjusting your filters or browse all products.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Product Grid */}
            <ProductGrid>
                {products.map((p) => (
                    <ProductCard
                        key={p.id}
                        id={p.id}
                        slug={p.slug}
                        title={p.name}
                        imageSrc={p.imageUrl ?? "/products/product-1.jpg"}
                        hoverImageSrc={p.hoverImageUrl}
                        price={p.price ?? undefined}
                        salePrice={p.salePrice}
                        discountPercentage={p.discountPercentage}
                        href={`/products/${p.slug}`}
                        averageRating={p.averageRating}
                        reviewCount={p.reviewCount}
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
            {canLoadMore && (
                <LoadMoreButton
                    onClick={handleLoadMore}
                    isPending={isPending}
                    disabled={false}
                />
            )}
        </div>
    );
}