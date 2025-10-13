// src/app/(root)/products/[id]/page.tsx
import { Suspense } from "react";
import { CollapsibleSection, ProductGallery } from "@/components";
import SimpleProductAddToCart from "@/components/products/product-detail/simple-product-add-to-cart";
import ConfigurableProductAddToCart from "@/components/products/product-detail/configurable-product-add-to-cart";
import { VariantSelectionProvider } from "@/components/VariantSelector";
import { getProduct, type FullProduct } from "@/lib/actions/product";
import RichTextViewer from "@/components/dashboard/rich-text-viewer";
import ReviewsSection from "@/components/products/product-detail/reviews-section";
import ProductNotFoundPage from "@/components/products/product-detail/product-not-found-page";
import ProductBreadcrumb from "@/components/products/product-detail/product-breadcrumb";
import AlsoLikeSection from "@/components/products/product-detail/also-like-section";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type GalleryVariant = { color: string; images: string[] };

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data) {
    return <ProductNotFoundPage />;
  }

  const { product, variants, images } = data;
  const isSimpleProduct = product.productType === 'simple';
  const isConfigurable = product.productType === 'configurable';

  console.log('[ProductDetailPage] data:', JSON.stringify(data, null, 2));

  // Handle gallery variants based on product type
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

  return (
    <main className="custom_container">
      {/* Breadcrumb */}
      <ProductBreadcrumb productName={product.name} />

      <section className="grid grid-cols-1 gap-10 2xl:gap-20 lg:grid-cols-2">
        {isConfigurable ? (
          <VariantSelectionProvider
            productId={product.id}
            variants={variants}
            galleryVariants={galleryVariants}
            defaultColorId={variants.find(v => v.id === product.defaultVariantId)?.color?.id}
            defaultSizeId={variants.find(v => v.id === product.defaultVariantId)?.size?.id}
          >
            {galleryVariants.length > 0 && (
              <ProductGallery productId={product.id} variants={galleryVariants} className="lg:sticky lg:top-6" />
            )}

            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-3">
                {/* Product Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-dark-900">{product.name}</h1>

                {/* Metadata Row: Brand, Category, Gender */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.brand && (
                    <Link href={`/brands/${product.brand.slug}`}>
                      <Badge
                        variant="secondary"
                        className="text-sm cursor-pointer hover:bg-gray-300 transition-colors"
                      >
                        {product.brand.name}
                      </Badge>
                    </Link>
                  )}
                  {product.category && (
                    <Link href={`/categories/${product.category.slug}`}>
                      <Badge
                        variant="outline"
                        className="text-sm cursor-pointer hover:border-gray-500 transition-colors"
                      >
                        {product.category.name}
                      </Badge>
                    </Link>
                  )}
                  {product.gender && (
                    <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                      {product.gender.label}
                    </span>
                  )}
                </div>
              </header>

              <ConfigurableProductAddToCart
                productId={product.id}
                productName={product.name}
                variants={variants as FullProduct['variants']}
              />

              {/* <Separator /> */}

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
                  <ReviewsSection productId={product.id} />
                </Suspense>
              </div>
            </div>
          </VariantSelectionProvider>
        ) : (
          <>
            {galleryVariants.length > 0 && (
              <ProductGallery productId={product.id} variants={galleryVariants} className="lg:sticky lg:top-6" />
            )}

            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-3">
                {/* Product Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-dark-900">{product.name}</h1>

                {/* Metadata Row: Brand, Category, Gender */}
                <div className="flex items-center gap-2 flex-wrap">
                  {product.brand && (
                    <Link href={`/brands/${product.brand.slug}`}>
                      <Badge
                        variant="secondary"
                        className="text-sm cursor-pointer hover:bg-gray-300 transition-colors"
                      >
                        {product.brand.name}
                      </Badge>
                    </Link>
                  )}
                  {product.category && (
                    <Link href={`/categories/${product.category.slug}`}>
                      <Badge
                        variant="outline"
                        className="text-sm cursor-pointer hover:border-gray-500 transition-colors"
                      >
                        {product.category.name}
                      </Badge>
                    </Link>
                  )}
                  {product.gender && (
                    <span className="text-sm text-gray-600 px-2 py-1 bg-gray-100 rounded">
                      {product.gender.label}
                    </span>
                  )}
                </div>

                {/* Optional: Subtitle for context */}
                {(product.gender?.label || product.category?.name) && (
                  <p className="text-sm text-gray-500">
                    {product.gender?.label && product.category?.name
                      ? `${product.gender.label} ${product.category.name}`
                      : product.gender?.label || product.category?.name}
                  </p>
                )}
              </header>

              <SimpleProductAddToCart
                productId={product.id}
                productName={product.name}
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
                <p>Free standard shipping and free 30-day returns for Nike Members.</p>
              </CollapsibleSection>

              <Suspense
                fallback={
                  <CollapsibleSection title="Reviews" value="reviews-loading">
                    <p className="text-body text-dark-700">Loading reviews…</p>
                  </CollapsibleSection>
                }
              >
                <ReviewsSection productId={product.id} />
              </Suspense>
            </div>
          </>
        )}
      </section>

      {/* Recommendations Section */}
      <Suspense
        fallback={
          <section className="mt-16">
            <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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