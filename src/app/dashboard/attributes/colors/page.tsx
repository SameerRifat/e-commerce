// src/app/dashboard/attributes/colors/page.tsx
import React from "react";
import { getColors } from "@/lib/actions/color-management";
import ToastHandler from "@/components/dashboard/attributes/toast-handler";
import ColorsPagination from "@/components/dashboard/attributes/colors-pagination";
import ColorsClientWrapper from "@/components/dashboard/attributes/colors-client-wrapper";

interface ColorsPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    success?: string;
  }>;
}

export default async function ColorsPage({ searchParams }: ColorsPageProps) {
  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1");

  // Server-side data fetching based on URL parameters
  const { colors, pagination } = await getColors({
    search,
    page,
    limit: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  return (
    <div className="space-y-6">
      {/* Toast handler for success messages */}
      <ToastHandler success={params.success} />

      {/* Client wrapper handles modals while server provides data */}
      <ColorsClientWrapper 
        initialColors={colors}
      />

      {/* Server-side pagination */}
      <ColorsPagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
      />
    </div>
  );
}