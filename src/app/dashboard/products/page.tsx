// src/app/dashboard/products/page.tsx
import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { getDashboardProducts, getDashboardFilterOptions } from "@/lib/actions/dashboard-products";
import type { 
  DashboardProductFilters,
  PageProps
} from "@/types/dashboard";
import { DashboardFilters, ProductsTableWrapper } from "@/components/dashboard/products";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";

type ProductsPageProps = PageProps;

// Helper function to safely get string parameter
function getStringParam(params: { [key: string]: string | string[] | undefined }, key: string): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

// Helper function to safely get number parameter
function getNumberParam(params: { [key: string]: string | string[] | undefined }, key: string, defaultValue: number): number {
  const value = getStringParam(params, key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

const ProductsPage: React.FC<ProductsPageProps> = async ({ searchParams }) => {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;
  
  // Parse search parameters
  const filters: DashboardProductFilters = {
    search: getStringParam(params, 'search'),
    status: getStringParam(params, 'status') as "all" | "published" | "draft" | undefined,
    category: getStringParam(params, 'category'),
    brand: getStringParam(params, 'brand'),
    productType: getStringParam(params, 'productType') as "all" | "simple" | "configurable" | undefined,
    sort: getStringParam(params, 'sort') as DashboardProductFilters['sort'],
    page: getNumberParam(params, 'page', 1),
    limit: getNumberParam(params, 'limit', 24),
  };

  try {
    // Fetch data in parallel
    const [productsResult, filterOptions] = await Promise.all([
      getDashboardProducts(filters),
      getDashboardFilterOptions(),
    ]);

    const { products, totalCount, stats } = productsResult;


    return (
      <div className="space-y-6">
        <PageHeader
          title="Products"
          description="Manage your product catalog with comprehensive filtering and search"
          action={{
            label: "Add Product",
            href: "/dashboard/products/new",
            icon: <Plus className="h-4 w-4" />,
          }}
        />

        {/* Filters */}
        <DashboardFilters
          brands={filterOptions.brands}
          categories={filterOptions.categories}
          currentFilters={{
            search: filters.search,
            status: filters.status,
            category: filters.category,
            brand: filters.brand,
            productType: filters.productType,
            sort: filters.sort,
          }}
        />

        {/* Data Table */}
        <ProductsTableWrapper
          data={products}
        />

        {/* Pagination */}
        <DashboardPagination
          currentPage={filters.page || 1}
          totalCount={totalCount}
          pageSize={filters.limit || 24}
          className="mt-8"
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading products:", error);
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Failed to load products</h2>
          <p className="text-gray-600 mt-2">There was an error loading the products. Please try again.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }
};

export default ProductsPage;