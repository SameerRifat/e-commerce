// src/app/dashboard/categories/[id]/edit/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import CategoryForm from "@/components/dashboard/categories/category-form";
import { getCategoryById, getAvailableParentCategories } from "@/lib/actions/category-management";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    fieldErrors?: string;
  }>;
}


export default async function EditCategoryPage({ params: paramsPromise, searchParams: searchParamsPromise }: EditCategoryPageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const categoryId = params.id;

  // Validate that we have a valid category ID
  if (!categoryId || typeof categoryId !== 'string') {
    notFound();
  }

  // Fetch category data and available parent categories
  const [category, availableParentCategories] = await Promise.all([
    getCategoryById(categoryId),
    getAvailableParentCategories(categoryId)
  ]);

  // If category not found, show 404
  if (!category) {
    notFound();
  }

  // Parse error data from URL params if present
  let fieldErrors: Record<string, string[]> | undefined;
  if (searchParams.fieldErrors) {
    try {
      fieldErrors = JSON.parse(searchParams.fieldErrors);
    } catch {
      // Invalid JSON, ignore
    }
  }

  return (
    <CategoryForm
      mode="edit"
      categoryId={categoryId}
      initialData={category}
      availableParentCategories={availableParentCategories}
      initialError={searchParams.error}
      initialFieldErrors={fieldErrors}
    />
  );
}