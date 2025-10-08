// src/app/dashboard/products/new/page.tsx
import { UnifiedProductForm } from "@/components/dashboard/products";
import { getProductFormReferenceData } from "@/lib/actions/product-management";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Suspense } from "react";
import LoadingState from "@/components/ui/loading-state";

const NewProductPage = async () => {
  try {
    // Fetch reference data on the server
    const referenceData = await getProductFormReferenceData();

    return (
      <ErrorBoundary>
        <UnifiedProductForm mode="create" referenceData={referenceData} />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to load reference data:", error);
    
    // Return error state
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-semibold mb-2">Failed to Load Page</h2>
        <p className="text-red-700 text-sm">
          Unable to load the product creation form. Please try refreshing the page.
        </p>
      </div>
    );
  }
};

// Wrap with Suspense for loading states
export default function NewProductPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingState size="lg" message="Loading product form..." className="py-20" />}>
      <NewProductPage />
    </Suspense>
  );
}
