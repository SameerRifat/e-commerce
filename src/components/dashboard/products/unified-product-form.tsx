// src/components/dashboard/products/unified-product-form.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Package,
  Image as ImageIcon,
  DollarSign,
  Warehouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Form } from "@/components/ui/form";
import PageHeader from "@/components/dashboard/page-header";
import { Progress } from "@/components/ui/progress";
import { Resolver, SubmitHandler } from "react-hook-form";
import {
  completeProductFormSchema,
  CompleteProductFormData
} from "@/lib/validations/product-form";
import { useStepValidation } from "@/hooks/use-step-validation";
import { createProduct, updateProduct, type ActionResult } from "@/lib/actions/product-management";
import { useRef } from "react";
import type { ImageUploadRef } from "../image-upload";

// Interface for pending images (with file data)
interface PendingImage {
  file?: File;
  url: string;
  id: string;
  isPrimary?: boolean;
  sortOrder?: number;
  variantId?: string | null;
}
import ProductBasicInfoStep from "./steps/ProductBasicInfoStep";
import ProductPricingStep from "./steps/ProductPricingStep";
import ProductVariantsStep from "./steps/ProductVariantsStep";
import ProductImagesStep from "./steps/ProductImagesStep";
import ProductInventoryStep from "./steps/ProductInventoryStep";
import StepNavigation from "./components/StepNavigation";

// Use the comprehensive validation schema
const unifiedProductSchema = completeProductFormSchema;
type UnifiedProductFormData = CompleteProductFormData;

interface UnifiedProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  initialData?: CompleteProductFormData;
  referenceData: {
    brands: Array<{ id: string; name: string; slug: string; logoUrl?: string | null }>;
    categories: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
    genders: Array<{ id: string; label: string; slug: string }>;
    colors: Array<{ id: string; name: string; slug: string; hexCode: string }>;
    sizes: Array<{ id: string; name: string; slug: string; sortOrder: number }>;
  };
}

const UnifiedProductForm: React.FC<UnifiedProductFormProps> = ({
  mode,
  productId,
  initialData,
  referenceData
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const imageUploadRef = useRef<ImageUploadRef>(null);

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Product" : "Create New Product";

  // Default values for create mode
  const defaultFormValues: CompleteProductFormData = {
    name: "",
    description: "",
    categoryId: null,
    genderId: null,
    brandId: null,
    isPublished: false,
    productType: "simple",
    sku: "",
    price: "",
    salePrice: null,
    inStock: 0,
    weight: null,
    dimensions: null,
    variants: [],
    images: [],
  };

  const form = useForm<UnifiedProductFormData>({
    resolver: zodResolver(unifiedProductSchema) as Resolver<UnifiedProductFormData>,
    defaultValues: defaultFormValues,
    mode: "onTouched",
  });

  // CRITICAL FIX: Reset form with initialData when in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      console.log("🔄 Resetting form with initial data:", {
        productType: initialData.productType,
        hasVariants: initialData.variants?.length > 0,
        hasImages: initialData.images?.length > 0,
        name: initialData.name,
      });
      
      // Reset the form with the initial data
      form.reset(initialData);
      
      console.log("✅ Form reset complete. Current values:", {
        name: form.getValues("name"),
        productType: form.getValues("productType"),
        variantCount: form.getValues("variants")?.length || 0,
        imageCount: form.getValues("images")?.length || 0,
      });
    }
  }, [isEditMode, initialData, form]);

  // Watch product type to update step labels dynamically
  const productType = form.watch("productType");

  const steps = useMemo(() => {
    const baseSteps = [
      { id: "basic", label: "Basic Info", icon: Package },
      {
        id: "variants",
        label: productType === "simple" ? "Pricing & Stock" : "Variants & Pricing",
        icon: DollarSign
      },
      { id: "images", label: "Images & Media", icon: ImageIcon },
    ];

    // Only add inventory step for configurable products (for advanced inventory management)
    if (productType === "configurable") {
      baseSteps.push({ id: "inventory", label: "Inventory Review", icon: Warehouse });
    }

    return baseSteps;
  }, [productType]);

  // Use the step validation hook
  const {
    canNavigateToStep,
    canProceedToNext,
    canGoToPrevious,
    completedSteps,
    accessibleSteps,
    isFormReadyForSubmission,
    progressPercentage,
    validateCurrentStep,
    getStepSummary,
  } = useStepValidation({ form, currentStep });


  // Add a new variant
  const addVariant = () => {
    const newVariant = {
      id: `temp-${Date.now()}`,
      sku: "",
      price: "",
      salePrice: null,
      colorId: null,
      sizeId: null,
      inStock: 0,
      weight: null,
      dimensions: null,
    };

    const currentVariants = form.getValues("variants") || [];
    form.setValue("variants", [...currentVariants, newVariant], { shouldValidate: true });
  };

  // Remove a variant
  const removeVariant = (index: number) => {
    const currentVariants = form.getValues("variants") || [];
    const updatedVariants = currentVariants.filter((_, i) => i !== index);
    form.setValue("variants", updatedVariants, { shouldValidate: true });
  };


  // Watch specific form values
  const watchedVariants = form.watch("variants");
  const watchedImages = form.watch("images");

  // Handle step navigation with validation
  const handleStepChange = useCallback(async (targetStep: number) => {
    if (!canNavigateToStep(targetStep)) {
      return; // Prevent navigation to inaccessible steps
    }

    // Validate current step before allowing navigation
    if (targetStep > currentStep) {
      const isCurrentStepValid = await validateCurrentStep();
      if (!isCurrentStepValid) {
        return; // Prevent forward navigation if current step is invalid
      }
    }

    setCurrentStep(targetStep);
  }, [canNavigateToStep, currentStep, validateCurrentStep]);

  const onSubmit = async (data: UnifiedProductFormData) => {
    console.log(`onSubmit is called for ${mode} mode`);
    
    if (!isFormReadyForSubmission) {
      setSubmitError("Form is not ready for submission");
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    
    try {
      console.log(`Submitting ${mode} product:`, JSON.stringify(data, null, 2));
      
      // Validate the complete form one more time
      const validationResult = unifiedProductSchema.safeParse(data);
      if (!validationResult.success) {
        console.error("Form validation failed:", validationResult.error);
        setSubmitError("Form validation failed");
        return;
      }

      // Check if there are any pending image uploads
      const hasPendingImages = data.images.some(img => 
        img.url.startsWith('blob:') || ('file' in img && (img as unknown as PendingImage).file)
      );

      const finalData = { ...data };
      
      // If there are pending images, upload them first (ATOMIC TRANSACTION APPROACH)
      if (hasPendingImages && imageUploadRef.current) {
        try {
          console.log(`🔄 Uploading ${data.images.length} pending images before product ${mode}...`);
          setSubmitError("Uploading images... Please wait.");
          
          const uploadedImages = await imageUploadRef.current.uploadPendingImages();
          
          // Validate that ALL images were uploaded successfully
          const failedUploads = uploadedImages.filter(img => 
            img.url.startsWith('blob:') || 
            !img.url.startsWith('http') ||
            img.url.includes('example.com')
          );
          
          if (failedUploads.length > 0) {
            console.error(`❌ ${failedUploads.length} image(s) failed to upload:`, failedUploads);
            throw new Error(
              `Upload failed for ${failedUploads.length} image(s). ` +
              `All images must be successfully uploaded before ${mode === 'edit' ? 'updating' : 'creating'} the product. ` +
              `Please check your internet connection and try again.`
            );
          }
          
          // Ensure we have at least one image with a valid URL
          const validImages = uploadedImages.filter(img => 
            img.url && 
            img.url.startsWith('http') && 
            !img.url.includes('example.com')
          );
          
          if (validImages.length === 0) {
            throw new Error("No valid images were uploaded. At least one image is required.");
          }
          
          finalData.images = uploadedImages;
          console.log(`✅ All ${uploadedImages.length} images uploaded successfully!`);
          setSubmitError(null);
        } catch (uploadError) {
          console.error("💥 Image upload failed:", uploadError);
          setSubmitError(
            uploadError instanceof Error 
              ? `Image Upload Failed: ${uploadError.message}` 
              : "Failed to upload images. Please check your connection and try again."
          );
          return;
        }
      }
      
      // Validate that all images have proper URLs
      const invalidImages = finalData.images.filter(img => 
        !img.url || (!img.url.startsWith('http') && !img.url.startsWith('https'))
      );
      
      if (invalidImages.length > 0) {
        setSubmitError("Some images have invalid URLs. Please re-upload your images.");
        return;
      }
      
      // Call appropriate server action based on mode
      console.log(`🚀 ${mode === 'edit' ? 'Updating' : 'Creating'} product with uploaded images...`);
      console.log("📊 Final product data:", {
        name: finalData.name,
        imageCount: finalData.images.length,
        imageUrls: finalData.images.map(img => img.url),
        productType: finalData.productType
      });
      
      const result: ActionResult<{ productId: string }> = mode === 'edit' && productId
        ? await updateProduct(productId, finalData)
        : await createProduct(finalData);
      
      if (result.success) {
        console.log("🎉 ATOMIC TRANSACTION COMPLETED SUCCESSFULLY!");
        console.log(`✅ Product ${mode === 'edit' ? 'updated' : 'created'} with ID:`, result.data?.productId);
        console.log("✅ Images successfully linked to product");
        router.push(`/dashboard/products?success=${mode === 'edit' ? 'updated' : 'created'}`);
      } else {
        console.error(`Product ${mode} failed:`, result.error);
        setSubmitError(result.error || `Failed to ${mode} product`);
        
        // Handle field errors
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof UnifiedProductFormData, {
              type: "server",
              message: errors.join(", "),
            });
          });
        }
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'saving'} product:`, error);
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={isEditMode 
          ? "Update product details, variants, pricing, and inventory" 
          : "Create a complete product with variants, pricing, and inventory in one streamlined flow"
        }
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={progressPercentage} className="w-32" />
            <span className="text-sm text-muted-foreground">
              {completedSteps.length}/{steps.length} completed
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </PageHeader>

      {/* Error Display */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-800">
              <strong>Error:</strong> {submitError}
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as SubmitHandler<UnifiedProductFormData>)} className="space-y-6">
          <Tabs value={steps[currentStep].id} className="space-y-6">
            {/* Step Navigation */}
            <StepNavigation
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              accessibleSteps={accessibleSteps}
              onStepChange={handleStepChange}
              getStepSummary={getStepSummary}
            />

            {/* Step 1: Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <ProductBasicInfoStep
                control={form.control}
                brands={referenceData.brands}
                categories={referenceData.categories}
                genders={referenceData.genders}
              />
            </TabsContent>

            {/* Step 2: Pricing (Simple) or Variants & Pricing (Configurable) */}
            <TabsContent value="variants" className="space-y-6">
              {productType === "simple" ? (
                <ProductPricingStep control={form.control} />
              ) : (
                <ProductVariantsStep
                  control={form.control}
                  variants={watchedVariants}
                  colors={referenceData.colors}
                  sizes={referenceData.sizes}
                  onAddVariant={addVariant}
                  onRemoveVariant={removeVariant}
                />
              )}
            </TabsContent>

            {/* Step 3: Images & Media */}
            <TabsContent value="images" className="space-y-6">
              <ProductImagesStep
                ref={imageUploadRef}
                images={watchedImages}
                variants={watchedVariants}
                colors={referenceData.colors}
                sizes={referenceData.sizes}
                onImagesChange={(newImages) => form.setValue("images", newImages)}
                maxImages={20}
              />
            </TabsContent>

            {/* Step 4: Inventory & Stock */}
            <TabsContent value="inventory" className="space-y-6">
              <ProductInventoryStep
                control={form.control}
                variants={watchedVariants}
                colors={referenceData.colors}
                sizes={referenceData.sizes}
              />
            </TabsContent>
          </Tabs>

          {/* Navigation & Submit */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStepChange(currentStep - 1)}
                disabled={!canGoToPrevious()}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleStepChange(currentStep + 1)}
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/products")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !isFormReadyForSubmission}
                className={`cursor-pointer ${!isFormReadyForSubmission ? "opacity-50" : ""}`}
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading 
                  ? `${mode === 'edit' ? 'Updating' : 'Creating'} Product...` 
                  : `${mode === 'edit' ? 'Update' : 'Create'} Product`
                }
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UnifiedProductForm;