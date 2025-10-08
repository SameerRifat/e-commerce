// src/app/dashboard/attributes/sizes/page.tsx
import React from "react";
import { getSizes } from "@/lib/actions/size-management";
import { getSizeCategories } from "@/lib/actions/size-category-management";
import ToastHandler from "@/components/dashboard/attributes/toast-handler";
import SizesPagination from "@/components/dashboard/attributes/sizes-pagination";
import SizesClientWrapper from "@/components/dashboard/attributes/sizes-client-wrapper";

interface SizesPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    success?: string;
    categoryId?: string;
  }>;
}

export default async function SizesPage({ searchParams }: SizesPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const categoryId = params.categoryId;

  // Fetch paginated sizes and categories list
  // Categories are only needed for the filter dropdown, not for overview
  const [
    { sizes, pagination }, 
    allCategories
  ] = await Promise.all([
    getSizes({
      search,
      page,
      limit: 10,
      sortBy: "sortOrder",
      sortOrder: "asc",
      categoryId,
    }),
    getSizeCategories(), // Only fetch for dropdown, not overview
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

      {/* Server-side pagination */}
      <SizesPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
      />
    </div>
  );
}
