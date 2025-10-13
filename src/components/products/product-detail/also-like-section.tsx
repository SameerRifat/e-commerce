// src/components/products/product-detail/also-like-section.tsx
import { getRecommendedProducts, type RecommendedProduct } from "@/lib/actions/product";
import ProductCard from "@/components/shared/product-card";

interface AlsoLikeSectionProps {
    productId: string;
}

export default async function AlsoLikeSection({ productId }: AlsoLikeSectionProps) {
    const recs: RecommendedProduct[] = await getRecommendedProducts(productId);

    if (!recs.length) return null;

    return (
        <section className="my-16">
            <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
                {recs.map((p) => (
                    <ProductCard
                        key={p.id}
                        title={p.title}
                        imageSrc={p.imageUrl}
                        price={p.price ?? undefined}
                        href={`/products/${p.id}`}
                    />
                ))}
            </div>
        </section>
    );
}