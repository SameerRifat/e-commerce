// src/app/dashboard/attributes/colors/page.tsx
import React from "react";
import { getColors } from "@/lib/actions/color-management";
import ToastHandler from "@/components/dashboard/attributes/toast-handler";
import ColorsClientWrapper from "@/components/dashboard/attributes/colors-client-wrapper";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";

interface ColorsPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
    limit?: string;
    success?: string;
  }>;
}

// Helper function to safely get number parameter
function getNumberParam(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export default async function ColorsPage({ searchParams }: ColorsPageProps) {
  const params = await searchParams;
  
  // Parse parameters with defaults
  const search = params.search || "";
  const page = getNumberParam(params.page, 1);
  const limit = getNumberParam(params.limit, 10);

  // Server-side data fetching based on URL parameters
  const { colors, pagination } = await getColors({
    search,
    page,
    limit,
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