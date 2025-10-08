// src/app/dashboard/brands/page.tsx
import React from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { getBrands } from "@/lib/actions/brand-management";
import ToastHandler from "@/components/dashboard/brands/toast-handler";
import BrandsTable from "@/components/dashboard/brands/brands-table";

interface BrandsPageProps {
  searchParams: Promise<{
    success?: string;
  }>;
}

export default async function BrandsPage({ searchParams }: BrandsPageProps) {
  const brands = await getBrands();
  const params = await searchParams;

  return (
    <div className="space-y-6">
      {/* Toast handler for success messages */}
      <ToastHandler success={params.success} />

      <PageHeader
        title="Brands"
        description="Manage cosmetics brands and their product portfolios"
        action={{
          label: "Add Brand",
          href: "/dashboard/brands/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <BrandsTable brands={brands} />
    </div>
  );
}
