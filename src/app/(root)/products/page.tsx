// src/app/(root)/products/page.tsx
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { parseFilterParams } from "@/lib/utils/query";
import { getAllProducts } from "@/lib/actions/product";
import { getFilterOptions } from "@/lib/actions/filters";
import FilterBadges from "@/components/products/filter-badges";
import { ProductGridClient } from "@/components/products/product-grid-client";

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
  const [{ products: initialProducts, totalCount }, filterOptions] =
    await Promise.all([
      getAllProducts(parsed),
      getFilterOptions(parsed),
    ]);

  return (
    <main className="custom_container pb-10">
      <header className="flex items-center justify-between py-6">
        <h1 className="text-heading-3 text-foreground">
          Products
        </h1>
        <Sort />
      </header>

      <FilterBadges />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <Filters filterOptions={filterOptions} />

        {/* Pass to client component for load more functionality */}
        <ProductGridClient
          initialProducts={initialProducts}
          totalCount={totalCount}
          filters={parsed}
        />
      </section>
    </main>
  );
}