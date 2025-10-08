// src/app/(root)/products/page.tsx
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { parseFilterParams } from "@/lib/utils/query";
import { getAllProducts } from "@/lib/actions/product";
import { getFilterOptions } from "@/lib/actions/filters";
import FilterBadges from "@/components/products/filter-badges";
import PaginationControls from "@/components/products/pagination-controls";
import ProductCard from "@/components/shared/product-card";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  // Parse filter parameters
  const parsed = parseFilterParams(sp);
  
  // Fetch products and filter options in parallel
  const [{ products, totalCount }, filterOptions] = await Promise.all([
    getAllProducts(parsed),
    getFilterOptions(parsed)
  ]);

  return (
    <main className="custom_container">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-heading-3 text-foreground">Products ({totalCount})</h1>
        <Sort />
      </header>

      <FilterBadges />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Filters filterOptions={filterOptions} />
        <div>
          {products.length === 0 ? (
            <div className="rounded-lg border border-border p-8 text-center">
              <p className="text-body text-foreground">
                No products match your current filters.
              </p>
              <p className="text-body-small text-muted-foreground mt-2">
                Try adjusting your filters or browse all products.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
              
              <PaginationControls
                totalCount={totalCount} 
                pageSize={parsed.limit || 24}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}