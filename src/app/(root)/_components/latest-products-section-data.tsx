// src/app/(root)/_components/latest-products-section-data.tsx
import { getAllProducts } from "@/lib/actions/product";
import LatestProductsSection from "@/components/home/latest-products";

export async function LatestProductsSectionData() {
    const { products } = await getAllProducts({ limit: 12 });
    return <LatestProductsSection products={products} />;
}