// src/app/(root)/collections/[slug]/page.tsx (FIXED & PRODUCTION-READY)
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { getCollectionBySlug, getCollectionProducts } from "@/lib/actions/collections";
import { CollectionProductGrid } from "@/components/collections/collection-product-grid";
import Sort from "@/components/Sort";

interface CollectionPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string; sort?: string }>;
}

export async function generateMetadata({
    params,
}: CollectionPageProps): Promise<Metadata> {
    const { slug } = await params;
    const collection = await getCollectionBySlug(slug);

    if (!collection) {
        return {
            title: "Collection Not Found",
        };
    }

    return {
        title: collection.metaTitle || collection.name,
        description: collection.metaDescription || collection.description || undefined,
        openGraph: {
            title: collection.metaTitle || collection.name,
            description: collection.metaDescription || collection.description || undefined,
            images: collection.imageUrl ? [{ url: collection.imageUrl }] : undefined,
        },
    };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
    const { slug } = await params;
    const sp = await searchParams;

    // Parse query params
    const page = Math.max(1, Number(sp.page) || 1);
    const sort = (sp.sort === 'price_asc' || sp.sort === 'price_desc' || sp.sort === 'newest' || sp.sort === 'featured')
        ? sp.sort
        : 'featured';

    // Fetch collection data with products
    const data = await getCollectionProducts(slug, page, 24, sort);

    if (!data) {
        notFound();
    }

    const { collection, products, totalCount, hasMore } = data;

    console.log('collection: ', JSON.stringify(collection, null, 2))

    // collection:  {
    //     "id": "2d056f12-c4b6-43c9-8a2a-6c504ab42c9a",
    //     "name": "Summer Collection 2025",
    //     "slug": "summer-collection-2025",
    //     "description": "",
    //     "imageUrl": "https://utfs.io/f/EG7XU6JuLb6T91INarwzDftnu0U7FRCJoP45YA1dOTQrXijy",
    //     "thumbnailUrl": "https://utfs.io/f/EG7XU6JuLb6TFgD0npBRzTiBJhsyG6Y1M3NcAEfZSl0k8Kax",
    //     "isPublished": true,
    //     "isFeatured": true,
    //     "displayOrder": 0,
    //     "collectionType": "manual",
    //     "automationRules": null,
    //     "metaTitle": "",
    //     "metaDescription": "",
    //     "publishedAt": null,
    //     "expiresAt": null,
    //     "createdAt": "2025-10-23T09:03:09.831Z",
    //     "updatedAt": "2025-10-23T09:06:09.201Z"
    //   }

    return (
        <main className="custom_container py-10">
            {/* Hero Section (if image exists) */}
            {collection.imageUrl && (
                <section className="relative h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-10">
                    <Image
                        src={collection.imageUrl}
                        alt={collection.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white max-w-3xl px-4">
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                {collection.name}
                            </h1>
                            {collection.description && (
                                <p className="text-lg md:text-xl opacity-90">
                                    {collection.description}
                                </p>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Header (if no hero image) */}
            {!collection.imageUrl && (
                <header className="mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{collection.name}</h1>
                    {collection.description && (
                        <p className="text-lg text-muted-foreground">
                            {collection.description}
                        </p>
                    )}
                </header>
            )}

            {/* Products Section */}
            <section>
                {products.length === 0 ? (
                    <div className="text-center py-16 border rounded-lg">
                        <p className="text-muted-foreground">
                            No products in this collection yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Sort Bar */}
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-sm text-muted-foreground">
                                Showing {products.length} of {totalCount} products
                            </p>
                            <Sort />
                        </div>

                        {/* Products Grid with Load More */}
                        <CollectionProductGrid
                            initialProducts={products}
                            totalCount={totalCount}
                            hasMore={hasMore}
                            collectionSlug={slug}
                            currentPage={page}
                            currentSort={sort}
                        />
                    </>
                )}
            </section>
        </main>
    );
}