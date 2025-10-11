// src/app/dashboard/attributes/sizes/page.tsx
import React from "react";
import { getSizes } from "@/lib/actions/size-management";
import { getSizeCategories } from "@/lib/actions/size-category-management";
import ToastHandler from "@/components/dashboard/attributes/toast-handler";
import SizesClientWrapper from "@/components/dashboard/attributes/sizes-client-wrapper";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";

interface SizesPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    success?: string;
    categoryId?: string;
  }>;
}

// Helper function to safely get number parameter
function getNumberParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export default async function SizesPage({ searchParams }: SizesPageProps) {
  const params = await searchParams;
  
  // Parse parameters with defaults
  const search = params.search || "";
  const page = getNumberParam(params.page, 1);
  const limit = getNumberParam(params.limit, 10); // 10 for production, can use 2 for testing
  const categoryId = params.categoryId;

  // Fetch paginated sizes and categories list
  const [
    { sizes, pagination }, 
    allCategories
  ] = await Promise.all([
    getSizes({
      search,
      page,
      limit,
      sortBy: "sortOrder",
      sortOrder: "asc",
      categoryId,
    }),
    getSizeCategories(), // Only fetch for dropdown
  ]);

  return (
    <div className="space-y-6">
      {/* Toast handler for success messages */}
      <ToastHandler success={params.success} />

      {/* Client wrapper handles modals while server provides data */}
      <SizesClientWrapper
        initialSizes={sizes}
        allCategories={allCategories}
        currentCategoryId={categoryId}
      />

      {/* Reuse DashboardPagination component */}
      <DashboardPagination
        currentPage={pagination.page}
        totalCount={pagination.total}
        pageSize={limit}
        className="mt-8"
      />
    </div>
  );
}