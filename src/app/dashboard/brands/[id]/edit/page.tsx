// src/app/dashboard/brands/[id]/edit/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import BrandForm from "@/components/dashboard/brands/brand-form";
import { getBrandById } from "@/lib/actions/brand-management";

interface EditBrandPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    fieldErrors?: string;
  }>;
}

export default async function EditBrandPage({ params: paramsPromise, searchParams: searchParamsPromise }: EditBrandPageProps) {
  const params = await paramsPromise;
  const searchParams = await searchParamsPromise;
  const brandId = params.id;

  // Validate that we have a valid brand ID
  if (!brandId || typeof brandId !== 'string') {
    notFound();
  }

  // Fetch brand data
  const brand = await getBrandById(brandId);

  // If brand not found, show 404
  if (!brand) {
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
    <BrandForm
      mode="edit"
      brandId={brandId}
      initialData={brand}
      initialError={searchParams.error}
      initialFieldErrors={fieldErrors}
    />
  );
}