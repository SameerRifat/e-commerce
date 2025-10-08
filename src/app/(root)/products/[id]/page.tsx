// src/app/(root)/products/[id]/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { CollapsibleSection, ProductGallery } from "@/components";
import { Star } from "lucide-react";
import SimpleProductAddToCart from "@/components/SimpleProductAddToCart";
import ConfigurableProductAddToCart from "@/components/ConfigurableProductAddToCart";
import { VariantSelectionProvider } from "@/components/VariantSelector";
import { getProduct, getProductReviews, getRecommendedProducts, type Review, type RecommendedProduct, type FullProduct } from "@/lib/actions/product";
import ProductCard from "@/components/shared/product-card";

type GalleryVariant = { color: string; images: string[] };

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) return undefined;
  return `$${price.toFixed(2)}`;
}

function NotFoundBlock() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
      <h1 className="text-heading-3 text-dark-900">Product not found</h1>
      <p className="mt-2 text-body text-dark-700">The product you’re looking for doesn’t exist or may have been removed.</p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}

async function ReviewsSection({ productId }: { productId: string }) {
  const reviews: Review[] = await getProductReviews(productId);
  const count = reviews.length;
  const avg =
    count > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / count) : 0;

  return (
    <CollapsibleSection
      title={`Reviews (${count})`}
      rightMeta={
        <span className="flex items-center gap-1 text-dark-900">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= Math.round(avg) ? "fill-[--color-dark-900]" : ""}`} />
          ))}
        </span>
      }
    >
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.slice(0, 10).map((r) => (
            <li key={r.id} className="rounded-lg border border-light-300 p-4">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-body-medium text-dark-900">{r.author}</p>
                <span className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= r.rating ? "fill-[--color-dark-900]" : ""}`} />
                  ))}
                </span>
              </div>
              {r.title && <p className="text-body-medium text-dark-900">{r.title}</p>}
              {r.content && <p className="mt-1 line-clamp-[8] text-body text-dark-700">{r.content}</p>}
              <p className="mt-2 text-caption text-dark-700">{new Date(r.createdAt).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}

async function AlsoLikeSection({ productId }: { productId: string }) {
  const recs: RecommendedProduct[] = await getRecommendedProducts(productId);
  if (!recs.length) return null;
  return (
    <section className="mt-16">
      <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProduct(id);

  if (!data) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="py-4 text-caption text-dark-700">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
          <span className="text-dark-900">Not found</span>
        </nav>
        <NotFoundBlock />
      </main>
    );
  }


  const { product, variants, images } = data;
  const isSimpleProduct = product.productType === 'simple';
  const isConfigurable = product.productType === 'configurable';

  // console.log('[ProductDetailPage] data:', JSON.stringify(data, null, 2));

  // Handle gallery variants based on product type
  let galleryVariants: GalleryVariant[] = [];
  
  if (isConfigurable && variants.length > 0) {
    // For configurable products, create gallery variants from product variants
    // Group variants by color first, then by size if needed
    const variantGroups = new Map<string, typeof variants>();
    
    variants.forEach((variant) => {
      const groupKey = variant.color?.name || 'Default';
      if (!variantGroups.has(groupKey)) {
        variantGroups.set(groupKey, []);
      }
      variantGroups.get(groupKey)!.push(variant);
    });

    // Pre-compute product-level images (always show these too)
    const productLevelImages = images
      .filter((img) => img.variantId === null)
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      })
      .map((img) => img.url)
      .filter(Boolean);

    // Create gallery variants for each color group
    galleryVariants = Array.from(variantGroups.entries()).map(([colorName, colorVariants]) => {
      // Get all images for variants of this color
      const variantImages = images
        .filter((img) => colorVariants.some(v => v.id === img.variantId))
        .sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })
        .map((img) => img.url);

      // Merge product-level and variant images (de-duplicate, keep order)
      const merged = Array.from(new Set([...(productLevelImages || []), ...variantImages]));

      return {
        color: colorName,
        images: merged,
      };
    }).filter((gv) => gv.images.length > 0);
  } else if (isSimpleProduct) {
    // For simple products, create a single gallery variant with all images
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

  // Handle pricing based on product type
  let basePrice: number | null = null;
  let salePrice: number | null = null;
  let displayPrice: number | null = null;
  let compareAt: number | null = null;
  let discount: number | null = null;

  if (isSimpleProduct) {
    // For simple products, use product-level pricing
    basePrice = product.price ? Number(product.price) : null;
    salePrice = product.salePrice ? Number(product.salePrice) : null;
    
    displayPrice = salePrice !== null && !Number.isNaN(salePrice) ? salePrice : basePrice;
    compareAt = salePrice !== null && !Number.isNaN(salePrice) ? basePrice : null;
  } else if (isConfigurable && variants.length > 0) {
    // For configurable products, use default variant or first variant pricing
    const defaultVariant = variants.find((v) => v.id === product.defaultVariantId) || variants[0];
    
    if (defaultVariant) {
      basePrice = Number(defaultVariant.price);
      salePrice = defaultVariant.salePrice ? Number(defaultVariant.salePrice) : null;
      
      displayPrice = salePrice !== null && !Number.isNaN(salePrice) ? salePrice : basePrice;
      compareAt = salePrice !== null && !Number.isNaN(salePrice) ? basePrice : null;
    }
  }

  // Calculate discount
  if (compareAt && displayPrice && compareAt > displayPrice) {
    discount = Math.round(((compareAt - displayPrice) / compareAt) * 100);
  }

  const subtitle = product.gender?.label ? `${product.gender.label} Shoes` : undefined;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="py-4 text-caption text-dark-700">
        <Link href="/" className="hover:underline">Home</Link> / <Link href="/products" className="hover:underline">Products</Link> /{" "}
        <span className="text-dark-900">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px]">
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
              <header className="flex flex-col gap-2">
                <h1 className="text-heading-2 text-dark-900">{product.name}</h1>
                {subtitle && <p className="text-body text-dark-700">{subtitle}</p>}
              </header>

              <div className="flex items-center gap-3">
                <p className="text-lead text-dark-900">{formatPrice(displayPrice)}</p>
                {compareAt && (
                  <>
                    <span className="text-body text-dark-700 line-through">{formatPrice(compareAt)}</span>
                    {discount !== null && (
                      <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-[--color-green]">
                        {discount}% off
                      </span>
                    )}
                  </>
                )}
              </div>

              <ConfigurableProductAddToCart 
                productId={product.id}
                productName={product.name}
                variants={variants as FullProduct['variants']}
              />

              <CollapsibleSection title="Product Details" defaultOpen>
                <p>{product.description}</p>
              </CollapsibleSection>

              <CollapsibleSection title="Shipping & Returns">
                <p>Free standard shipping and free 30-day returns for Nike Members.</p>
              </CollapsibleSection>

              <Suspense
                fallback={
                  <CollapsibleSection title="Reviews">
                    <p className="text-body text-dark-700">Loading reviews…</p>
                  </CollapsibleSection>
                }
              >
                <ReviewsSection productId={product.id} />
              </Suspense>
            </div>
          </VariantSelectionProvider>
        ) : (
          <>
            {galleryVariants.length > 0 && (
              <ProductGallery productId={product.id} variants={galleryVariants} className="lg:sticky lg:top-6" />
            )}

            <div className="flex flex-col gap-6">
              <header className="flex flex-col gap-2">
                <h1 className="text-heading-2 text-dark-900">{product.name}</h1>
                {subtitle && <p className="text-body text-dark-700">{subtitle}</p>}
              </header>

              <div className="flex items-center gap-3">
                <p className="text-lead text-dark-900">{formatPrice(displayPrice)}</p>
                {compareAt && (
                  <>
                    <span className="text-body text-dark-700 line-through">{formatPrice(compareAt)}</span>
                    {discount !== null && (
                      <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-[--color-green]">
                        {discount}% off
                      </span>
                    )}
                  </>
                )}
              </div>

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
                }}
              />

              <CollapsibleSection title="Product Details" defaultOpen>
                <p>{product.description}</p>
              </CollapsibleSection>

              <CollapsibleSection title="Shipping & Returns">
                <p>Free standard shipping and free 30-day returns for Nike Members.</p>
              </CollapsibleSection>

              <Suspense
                fallback={
                  <CollapsibleSection title="Reviews">
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

      <Suspense
        fallback={
          <section className="mt-16">
            <h2 className="mb-6 text-heading-3 text-dark-900">You Might Also Like</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-light-200" />
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
