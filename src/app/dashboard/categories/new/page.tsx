// src/app/dashboard/categories/new/page.tsx
import React from "react";
import CategoryForm from "@/components/dashboard/categories/category-form";
import { getAvailableParentCategories } from "@/lib/actions/category-management";

interface NewCategoryPageProps {
  searchParams: {
    error?: string;
    fieldErrors?: string;
  };
}


export default async function NewCategoryPage({ searchParams }: NewCategoryPageProps) {
  const params = await searchParams;
  const availableParentCategories = await getAvailableParentCategories();
  
  // Parse error data from URL params if present
  let fieldErrors: Record<string, string[]> | undefined;
  if (params.fieldErrors) {
    try {
      fieldErrors = JSON.parse(params.fieldErrors);
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <CategoryForm
      mode="create"
      availableParentCategories={availableParentCategories}
      initialError={params.error}
      initialFieldErrors={fieldErrors}
    />
  );
}
