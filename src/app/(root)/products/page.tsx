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
      <header className="hidden sm:flex items-center justify-between gap-x-5 gap-y-4 flex-wrap py-6">
        <h1 className="text-lg font-medium">
          Products
        </h1>
        <Sort />
      </header>

      <FilterBadges />

      <section className="grid grid-cols-1 gap-2 sm:gap-4 md:gap-6 lg:grid-cols-[250px_1fr] xl:grid-cols-[260px_1fr] 2xl:grid-cols-[270px_1fr]">
        <div className="flex items-start justify-between gap-4 flex-wrap pt-6 sm:pt-0 ">
          <div className="flex sm:hidden">
            <Sort />
          </div>
          <Filters filterOptions={filterOptions} />
        </div>

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