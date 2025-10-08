// src/app/dashboard/categories/page.tsx
import React from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import { getCategories } from "@/lib/actions/category-management";
import ToastHandler from "@/components/dashboard/categories/toast-handler";
import CategoriesTable from "@/components/dashboard/categories/categories-table";

interface CategoriesPageProps {
  searchParams: Promise<{
    success?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const categories = await getCategories();
  const params = await searchParams;


  return (
    <div className="space-y-6">
      {/* Toast handler for success messages */}
      <ToastHandler success={params.success} />

      <PageHeader
        title="Categories"
        description="Organize your products with hierarchical categories"
        action={{
          label: "Add Category",
          href: "/dashboard/categories/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <CategoriesTable categories={categories} />
    </div>
  );
}