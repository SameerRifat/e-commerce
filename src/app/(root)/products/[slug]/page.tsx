// src/app/(root)/products/[slug]/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { CollapsibleSection, ProductGallery } from "@/components";
import SimpleProductAddToCart from "@/components/products/product-detail/simple-product-add-to-cart";
import ConfigurableProductAddToCart from "@/components/products/product-detail/configurable-product-add-to-cart";
import { getProductBySlug, type FullProduct } from "@/lib/actions/product";
import RichTextViewer from "@/components/dashboard/rich-text-viewer";
import ReviewsSection from "@/components/products/product-detail/reviews-section";
import ProductNotFoundPage from "@/components/products/product-detail/product-not-found-page";
import ProductBreadcrumb from "@/components/products/product-detail/product-breadcrumb";
import AlsoLikeSection from "@/components/products/product-detail/also-like-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/utils/json-ld";

type Props = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generate dynamic metadata for product pages
 * Includes Open Graph, Twitter Cards, and SEO optimization
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await getProductBySlug(slug);

    if (!data) {
        return {
            title: "Product Not Found",
            description: "The product you're looking for could not be found.",
        };
    }

    const { product, variants, images } = data;

    // Get primary image
    const primaryImage = images.find(img => img.isPrimary)?.url || images[0]?.url;

    // Generate description from first 160 chars of description
    const description = product.description
        ? product.description.substring(0, 160) + "..."
        : `Shop ${product.name} at Cosmeticspk. Premium cosmetics and beauty products.`;

    // Calculate price for display
    let price: number | undefined;
    if (product.productType === 'simple') {
        const salePrice = product.salePrice ? Number(product.salePrice) : undefined;
        const regularPrice = product.price ? Number(product.price) : undefined;
        price = salePrice || regularPrice;
    } else {
        const defaultVariant = variants.find(v => v.id === product.defaultVariantId);
        const firstVariant = variants[0];
        const variantToUse = defaultVariant || firstVariant;
        if (variantToUse) {
            const salePrice = variantToUse.salePrice ? Number(variantToUse.salePrice) : undefined;
            const regularPrice = variantToUse.price ? Number(variantToUse.price) : undefined;
            price = salePrice || regularPrice;
        }
    }

    const title = `${product.name}${price ? ` - Rs. ${price}` : ''}`;

    return {
        title,
        description,
        keywords: [
            product.name,
            product.brand?.name || '',
            product.category?.name || '',
            'cosmetics',
            'beauty products',
        ].filter(Boolean),
        openGraph: {
            title,
            description,
            url: `/products/${product.slug}`,
            type: 'website',
            images: primaryImage ? [
                {
                    url: primaryImage,
                    width: 800,
                    height: 800,
                    alt: product.name,
                },
            ] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: primaryImage ? [primaryImage] : [],
        },
    };
}

/**
 * Product Detail Page - Server Component
 *
 * Industry Pattern: URL-based variant selection (Shopify Hydrogen approach)
 * - Variant state in URL params (?color=coral&size=1ml)
 * - SEO-friendly (each variant has unique URL)
 * - Shareable product links with specific variant selected
 * - Progressive enhancement compatible
 */
export default async function ProductDetailPage({ params, searchParams }: Props) {
    const { slug } = await params;
    const sp = await searchParams;
    const data = await getProductBySlug(slug);

    if (!data) {
        return <ProductNotFoundPage />;
    }

    const { product, variants, images } = data;
    const isSimpleProduct = product.productType === 'simple';
    const isConfigurable = product.productType === 'configurable';

    type GalleryVariant = { color: string; images: string[] };
    let galleryVariants: GalleryVariant[] = [];

    if (isConfigurable && variants.length > 0) {
        const variantGroups = new Map<string, typeof variants>();

        variants.forEach((variant) => {
            const groupKey = variant.color?.name || 'Default';
            if (!variantGroups.has(groupKey)) {
                variantGroups.set(groupKey, []);
            }
            variantGroups.get(groupKey)!.push(variant);
        });

        const productLevelImages = images
            .filter((img) => img.variantId === null)
            .sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            })
            .map((img) => img.url)
            .filter(Boolean);

        galleryVariants = Array.from(variantGroups.entries()).map(([colorName, colorVariants]) => {
            const variantImages = images
                .filter((img) => colorVariants.some(v => v.id === img.variantId))
                .sort((a, b) => {
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
                })
                .map((img) => img.url);

            const merged = Array.from(new Set([...(productLevelImages || []), ...variantImages]));

            return {
                color: colorName,
                images: merged,
            };
        }).filter((gv) => gv.images.length > 0);
    } else if (isSimpleProduct) {
        const productImages = images
            .sort((a, b) => {
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
            })
            .map((img) => img.url);

        if (productImages.length > 0) {
            galleryVariants = [{
                color: "Default",
                images: productImages,
            }];
        }
    }

    // Get selected color from URL for gallery
    const selectedColorSlug = typeof sp.color === 'string' ? sp.color : undefined;
    const selectedColorName = selectedColorSlug
        ? variants.find(v => v.color?.slug === selectedColorSlug)?.color?.name
        : undefined;

    // Generate JSON-LD structured data
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cosmeticspk.com';
    const productSchema = generateProductSchema({
        product,
        variants,
        images,
        baseUrl,
        // TODO: Add review data when available
        // averageRating: product.averageRating,
        // reviewCount: product.reviewCount,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        ...(product.category ? [{ name: product.category.name, url: `/products?category=${product.category.slug}` }] : []),
        { name: product.name },
    ]);

    return (
        <main className="custom_container">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {/* Breadcrumb */}
            <ProductBreadcrumb productName={product.name} />

            <section className="grid grid-cols-1 gap-8 sm:gap-10 2xl:gap-14 lg:grid-cols-2 2xl:grid-cols-[1fr_650px]">
                {isConfigurable ? (
                    <>
                        {/* Product Gallery - Simple prop-based pattern */}
                        {galleryVariants.length > 0 && (
                            <ProductGallery
                                variants={galleryVariants}
                                selectedColorName={selectedColorName}
                                className="lg:sticky lg:top-6"
                            />
                        )}

                        <div className="flex flex-col gap-6">
                            <header className="flex flex-col gap-3">
                                {/* Product Title */}
                                <h1 className="text-lg sm:text-xl 2xl:text-2xl font-semibold">{product.name}</h1>

                                {/* Metadata Row: Brand, Category, Gender */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {product.brand && (
                                        <Link href={`/products?brand=${product.brand.slug}`}>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs sm:text-sm cursor-pointer hover:bg-gray-300 transition-colors font-medium"
                                            >
                                                {product.brand.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    {product.category && (
                                        <Link href={`/products?category=${product.category.slug}`}>
                                            <Badge
                                                variant="outline"
                                                className="text-xs sm:text-sm cursor-pointer hover:border-gray-500 transition-colors font-medium"
                                            >
                                                {product.category.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    {product.gender && (
                                        <Badge variant='secondary' className="text-xs sm:text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded-full font-medium">
                                            {product.gender.label}
                                        </Badge>
                                    )}
                                </div>
                            </header>

                            {/* URL-based variant selection */}
                            <ConfigurableProductAddToCart
                                productId={product.id}
                                productName={product.name}
                                productSlug={product.slug}
                                variants={variants as FullProduct['variants']}
                            />

                            <div>
                                <CollapsibleSection title="Product Details" value="details" defaultOpen>
                                    <RichTextViewer content={product.description} />
                                </CollapsibleSection>

                                <Suspense
                                    fallback={
                                        <CollapsibleSection title="Reviews" value="reviews-loading">
                                            <p className="text-body text-dark-700">Loading reviews…</p>
                                        </CollapsibleSection>
                                    }
                                >
                                    <ReviewsSection
                                        productId={product.id}
                                        productName={product.name}
                                        productSlug={product.slug}
                                    />
                                </Suspense>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {galleryVariants.length > 0 && (
                            <ProductGallery
                                variants={galleryVariants}
                                className="lg:sticky lg:top-6"
                            />
                        )}

                        <div className="flex flex-col gap-6">
                            <header className="flex flex-col gap-3">
                                {/* Product Title */}
                                <h1 className="text-lg sm:text-xl 2xl:text-2xl font-semibold">{product.name}</h1>

                                {/* Metadata Row: Brand, Category, Gender */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {product.brand && (
                                        <Link href={`/brands/${product.brand.slug}`}>
                                            <Badge
                                                variant="secondary"
                                                className="text-xs sm:text-sm cursor-pointer hover:bg-gray-300 transition-colors font-medium"
                                            >
                                                {product.brand.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    {product.category && (
                                        <Link href={`/categories/${product.category.slug}`}>
                                            <Badge
                                                variant="outline"
                                                className="text-xs sm:text-sm cursor-pointer hover:border-gray-500 transition-colors font-medium"
                                            >
                                                {product.category.name}
                                            </Badge>
                                        </Link>
                                    )}
                                    {product.gender && (
                                        <Badge variant='secondary' className="text-xs sm:text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded-full font-medium">
                                            {product.gender.label}
                                        </Badge>
                                    )}
                                </div>

                            </header>

                            <SimpleProductAddToCart
                                productId={product.id}
                                productName={product.name}
                                productSlug={product.slug}
                                product={{
                                    id: product.id,
                                    name: product.name,
                                    productType: 'simple',
                                    price: product.price,
                                    salePrice: product.salePrice,
                                    sku: product.sku,
                                    inStock: product.inStock,
                                    weight: product.weight,
                                    dimensions: product.dimensions,
                                }}
                            />

                            <Separator />

                            <CollapsibleSection title="Product Details" value="details" defaultOpen>
                                <RichTextViewer content={product.description} />
                            </CollapsibleSection>

                            <CollapsibleSection title="Shipping & Returns" value="shipping">
                                <p>Free standard shipping on orders over Rs. 3000 and easy 30-day returns.</p>
                            </CollapsibleSection>

                            <Suspense
                                fallback={
                                    <CollapsibleSection title="Reviews" value="reviews-loading">
                                        <p className="text-body text-dark-700">Loading reviews…</p>
                                    </CollapsibleSection>
                                }
                            >
                                <ReviewsSection
                                    productId={product.id}
                                    productName={product.name}
                                    productSlug={product.slug}
                                />
                            </Suspense>
                        </div>
                    </>
                )}
            </section>

            {/* Recommendations Section */}
            <Suspense
                fallback={
                    <section className="py-10 sm:py-12 md:py-14">
                        <h2 className="text-lg sm:text-xl 2xl:text-2xl font-medium leading-tight mb-3 sm:mb-5">You Might Also Like</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-64 rounded-xl" />
                            ))}
                        </div>
                    </section>
                }
            >
                <AlsoLikeSection productId={product.id} />
            </Suspense>
        </main>
    );
}
