// src/app/dashboard/products/[id]/edit/page.tsx
import { UnifiedProductForm } from "@/components/dashboard/products";
import { getProductFormReferenceData } from "@/lib/actions/product-management";
import { getProduct } from "@/lib/actions/product";
import ErrorBoundary from "@/components/ui/error-boundary";
import { Suspense } from "react";
import LoadingState from "@/components/ui/loading-state";
import { notFound } from "next/navigation";
import type { CompleteProductFormData } from "@/lib/validations/product-form";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

const EditProductPage = async ({ params }: EditProductPageProps) => {
  try {
    // Fetch both reference data and product data in parallel
    const [referenceData, productData] = await Promise.all([
      getProductFormReferenceData(),
      getProduct(params.id),
    ]);

    // If product not found, show 404
    if (!productData) {
      notFound();
    }

    console.log("📦 Loading product for edit:", {
      id: params.id,
      name: productData.product.name,
      productType: productData.product.productType,
      variantCount: productData.variants.length,
      imageCount: productData.images.length,
    });

    // Helper function to safely parse dimensions
    const parseDimensions = (dimensions: unknown): { length?: number; width?: number; height?: number } | null => {
      if (!dimensions || typeof dimensions !== 'object') return null;
      
      const dim = dimensions as any;
      const result: { length?: number; width?: number; height?: number } = {};
      
      if (typeof dim.length === 'number' && dim.length > 0) result.length = dim.length;
      if (typeof dim.width === 'number' && dim.width > 0) result.width = dim.width;
      if (typeof dim.height === 'number' && dim.height > 0) result.height = dim.height;
      
      return Object.keys(result).length > 0 ? result : null;
    };

    // Transform product data to match form structure
    const initialData: CompleteProductFormData = {
      // Basic Info
      name: productData.product.name,
      description: productData.product.description || "",
      categoryId: productData.product.categoryId || null,
      genderId: productData.product.genderId || null,
      brandId: productData.product.brandId || null,
      isPublished: productData.product.isPublished,
      productType: productData.product.productType,
      
      // Simple product fields (only populate if it's a simple product)
      ...(productData.product.productType === 'simple' ? {
        sku: productData.product.sku || "",
        price: productData.product.price || "",
        salePrice: productData.product.salePrice || null,
        inStock: productData.product.inStock ?? 0,
        weight: productData.product.weight ?? null,
        dimensions: parseDimensions(productData.product.dimensions),
      } : {
        sku: undefined,
        price: undefined,
        salePrice: null,
        inStock: undefined,
        weight: null,
        dimensions: null,
      }),
      
      // Configurable product fields (only populate if it's a configurable product)
      variants: productData.product.productType === 'configurable' 
        ? productData.variants.map(variant => ({
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            salePrice: variant.salePrice || null,
            colorId: variant.colorId || null,
            sizeId: variant.sizeId || null,
            inStock: variant.inStock ?? 0,
            weight: variant.weight ?? null,
            dimensions: parseDimensions(variant.dimensions),
          }))
        : [],
      
      // Images (always populate)
      images: productData.images
        .sort((a, b) => {
          // Sort by primary first, then by sort order
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        })
        .map((image, index) => ({
          id: image.id,
          url: image.url,
          isPrimary: image.isPrimary ?? false,
          sortOrder: image.sortOrder ?? index,
          variantId: image.variantId || null,
          alt: undefined, // Alt text not stored in DB currently
        })),
    };

    console.log('[EditProductPage] initialData: ', JSON.stringify(initialData, null, 2))

    return (
      <ErrorBoundary>
        <UnifiedProductForm 
          mode="edit" 
          productId={params.id}
          referenceData={referenceData}
          initialData={initialData}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to load product data:", error);
    
    // Return error state
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-semibold mb-2">Failed to Load Product</h2>
        <p className="text-red-700 text-sm">
          Unable to load the product data. Please try refreshing the page or return to the products list.
        </p>
        {error instanceof Error && (
          <details className="mt-4">
            <summary className="text-xs text-red-600 cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    );
  }
};

// Wrap with Suspense for loading states
export default function EditProductPageWithSuspense({ params }: EditProductPageProps) {
  return (
    <Suspense fallback={<LoadingState size="lg" message="Loading product..." className="py-20" />}>
      <EditProductPage params={params} />
    </Suspense>
  );
}