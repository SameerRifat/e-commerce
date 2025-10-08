// src/app/dashboard/brands/new/page.tsx
import React from "react";
import BrandForm from "@/components/dashboard/brands/brand-form";

interface NewBrandPageProps {
  searchParams: Promise<{
    error?: string;
    fieldErrors?: string;
  }>;
}

export default async function NewBrandPage({ searchParams }: NewBrandPageProps) {
  const params = await searchParams;
  
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
    <BrandForm
      mode="create"
      initialError={params.error}
      initialFieldErrors={fieldErrors}
    />
  );
}
