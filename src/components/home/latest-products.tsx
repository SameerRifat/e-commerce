// src/components/home/latest-products.tsx (Updated)
import React from "react";
import ProductCard from "@/components/shared/product-card";
import Link from "next/link";
import SectionHeader from "../shared/section-header";

interface Product {
    id: string;
    slug: string; // ADD THIS
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
            <SectionHeader
                title="Latest Products"
                // subtitle="Fresh additions to our collection"
                viewAllHref="/products"
                viewAllLabel="View All"
            />
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
                {products.map((p) => {
                    return (
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
                            // href is automatically generated from slug: /products/{slug}
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