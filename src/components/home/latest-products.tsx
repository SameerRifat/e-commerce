// src/components/home/latest-products.tsx (Updated)
import React from "react";
import ProductCard from "@/components/shared/product-card";
import Link from "next/link";
import SectionHeader from "../shared/section-header";
import { Button } from "../ui/button";
import ProductGrid from "@/components/shared/product-grid";

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
        <section aria-labelledby="latest" className="custom_container">
            <SectionHeader
                title="Latest Products"
                // subtitle="Fresh additions to our collection"
                viewAllHref="/products"
                viewAllLabel="View All"
            />
            <ProductGrid>
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
            </ProductGrid>

            {/* Mobile-only View All Button */}
            <div className="flex justify-center md:hidden mt-6 sm:mt-8">
                <Button
                    asChild
                    className="w-full sm:w-auto"
                >
                    <Link href="/products">
                        View All Products
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default LatestProductsSection;