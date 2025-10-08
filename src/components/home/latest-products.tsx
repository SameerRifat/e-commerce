// ============================================
// src/components/home/sections/LatestProductsSection.tsx
// ============================================
import React from "react";
import ProductCard from "@/components/shared/product-card";

interface Product {
    id: string;
    name: string;
    imageUrl: string | null;
    hoverImageUrl?: string | null;
    price: number | null;
    salePrice: number | null;
    discountPercentage: number | null;
    averageRating: number | null;
    reviewCount: number;
}

interface LatestProductsSectionProps {
    products: Product[];
}

const LatestProductsSection: React.FC<LatestProductsSectionProps> = ({ products }) => {
    return (
        <section aria-labelledby="latest" className="custom_container py-12">
            <h2 id="latest" className="mb-6 text-heading-3 text-dark-900">
                Latest Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
                {products.map((p) => {
                    return (
                        <ProductCard
                            key={p.id}
                            title={p.name}
                            imageSrc={p.imageUrl ?? "/products/product-1.jpg"}
                            hoverImageSrc={p.hoverImageUrl}
                            price={p.price ?? undefined}
                            salePrice={p.salePrice}
                            discountPercentage={p.discountPercentage}
                            href={`/products/${p.id}`}
                            averageRating={p.averageRating}
                            reviewCount={p.reviewCount}
                        />
                    );
                })}
            </div>
        </section>
    );
};

export default LatestProductsSection;