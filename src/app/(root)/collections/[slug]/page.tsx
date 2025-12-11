// src/app/(root)/collections/[slug]/page.tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { getCollectionBySlug } from "@/lib/actions/collections";
import { getCollectionProductsWithFilters } from "@/lib/actions/collections-filtered";
import { getCollectionFilterOptions } from "@/lib/actions/collection-filter-options";
import { CollectionProductGrid } from "@/components/collections/collection-product-grid";
import { parseFilterParams } from "@/lib/utils/query";
import Filters from "@/components/Filters";
import FilterBadges from "@/components/products/filter-badges";
import Sort from "@/components/Sort";

interface CollectionPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
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

    // SEO best practices: Complete metadata for search engines and social sharing
    // Industry standard: Shopify, WooCommerce all include Twitter cards
    const title = collection.metaTitle || collection.name;
    const description = collection.metaDescription || collection.description || undefined;
    const images = collection.imageUrl ? [collection.imageUrl] : undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: images ? [{ url: images[0] }] : undefined,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        },
    };
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
    const { slug } = await params;
    const sp = await searchParams;

    // Parse filter parameters
    const parsed = parseFilterParams(sp);

    // Fetch collection data with filtered products
    const data = await getCollectionProductsWithFilters(slug, parsed);

    if (!data) {
        notFound();
    }

    const { collection, products, totalCount, hasMore, page } = data;

    // Fetch filter options for this collection
    const filterOptions = await getCollectionFilterOptions(slug);

    return (
        <main className="custom_container pb-10">
            {/* Hero Section (if image exists) */}
            {/* image dimensions: 2048/768 */}
            {collection.imageUrl && (
                <section className="relative aspect-[2048/768] max-h-[calc(100vh - 100px)] overflow-hidden mb-10">
                    <Image
                        src={collection.imageUrl}
                        alt={collection.name}
                        fill
                        priority
                        className="object-cover"
                    />
                    {/* <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
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
                    </div> */}
                </section>
            )}

            {/* Header (if no hero image) */}
            {!collection.imageUrl && (
                <header className="mt-4 sm:mt-6 xl:mt-10">
                    <h1 className="text-xl sm:text-2xl xl:text-3xl font-semibold">{collection.name}</h1>
                    {collection.description && (
                        <p className="sm:text-lg text-muted-foreground">
                            {collection.description}
                        </p>
                    )}
                </header>
            )}

            {/* Products Section with Filters */}
            <section>
                {products.length === 0 && Object.values(parsed).every(v => !v || (Array.isArray(v) && v.length === 0)) ? (
                    <div className="text-center py-16 border rounded-lg">
                        <p className="text-muted-foreground">
                            No products in this collection yet.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Header */}
                        <div className="hidden sm:block">
                            <header className="flex items-center justify-between gap-x-5 gap-y-4 flex-wrap pb-6 mt-4">
                                <h2 className="text-lg font-medium">
                                    {totalCount === 0 ? 'No' : totalCount} {totalCount === 1 ? 'Product' : 'Products'}
                                </h2>
                                <Sort />
                            </header>
                            <FilterBadges />
                        </div>

                        {/* Filter + Products Grid Layout */}
                        <div className="grid grid-cols-1 gap-2 sm:gap-4 md:gap-6 lg:grid-cols-[250px_1fr] xl:grid-cols-[260px_1fr] 2xl:grid-cols-[270px_1fr]">
                            {/* Filter Sidebar */}
                            <div className="flex items-start justify-between gap-4 flex-wrap mt-3 sm:mt-0">
                                <div className="flex sm:hidden">
                                    <Sort />
                                </div>
                                <Filters filterOptions={filterOptions} />
                            </div>

                            {/* Mobile Filter Badges */}
                            <div className="block sm:hidden">
                                <FilterBadges />
                            </div>

                            {/* Products Grid */}
                            <div>
                                {products.length === 0 ? (
                                    <div className="text-center py-16 border rounded-lg">
                                        <p className="text-muted-foreground mb-4">
                                            No products match your filters.
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Try adjusting your filter criteria.
                                        </p>
                                    </div>
                                ) : (
                                    <CollectionProductGrid
                                        initialProducts={products}
                                        totalCount={totalCount}
                                        hasMore={hasMore}
                                        collectionSlug={slug}
                                        currentPage={page}
                                        currentSort={parsed.sort || 'featured'}
                                        filters={parsed}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}