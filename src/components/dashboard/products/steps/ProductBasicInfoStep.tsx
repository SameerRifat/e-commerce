// src/components/dashboard/products/steps/ProductBasicInfoStep.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Package, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import RichTextEditor from "@/components/dashboard/rich-text-editor";
import HierarchicalCategorySelect from "@/components/dashboard/hierarchical-category-select";
import { VALIDATION_RULES } from "@/lib/validations/product-form";
import { Button } from "@/components/ui/button";
import { CompleteProductFormData } from "@/lib/validations/product-form";

interface ProductBasicInfoStepProps {
  control: Control<CompleteProductFormData>;
  watch: UseFormWatch<CompleteProductFormData>;
  setValue: UseFormSetValue<CompleteProductFormData>;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; slug: string; parentId?: string | null }>;
  genders: Array<{ id: string; label: string }>;
  mode?: "create" | "edit";
}

// Helper function to generate slug from name (client-side)
function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 100);
}

const ProductBasicInfoStep: React.FC<ProductBasicInfoStepProps> = ({
  control,
  watch,
  setValue,
  brands,
  categories,
  genders,
  mode = "create", 
}) => {
  const productName = watch("name");
  const currentSlug = watch("slug");
  const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

  // Track if this is the initial mount in edit mode
  const isInitialMount = useRef(true);
  const initialSlug = useRef<string | null>(null);

  // Capture initial slug on mount (for edit mode)
  useEffect(() => {
    if (isInitialMount.current && mode === "edit" && currentSlug) {
      initialSlug.current = currentSlug;
      isInitialMount.current = false;
      console.log("📌 Captured initial slug in edit mode:", currentSlug);
    }
  }, [currentSlug, mode]);

  // Auto-generate slug from name (only in CREATE mode and if not manually edited)
  useEffect(() => {
    if (mode === "create" && productName && !slugManuallyEdited) {
      const generatedSlug = generateSlugFromName(productName);
      setValue("slug", generatedSlug, { shouldValidate: true });
    }
  }, [productName, slugManuallyEdited, setValue, mode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Basic Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Row 1: Product Name & Target Gender */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Luxe Matte Lipstick"
                      maxLength={VALIDATION_RULES.product.name.maxLength}
                      className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/{VALIDATION_RULES.product.name.maxLength} characters
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="genderId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Target Gender</FormLabel>
                  <Select
                    key={`gender-${field.value}`}
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select target gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {genders.map((gender) => (
                        <SelectItem key={gender.id} value={gender.id}>
                          {gender.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Row 2: Product Slug & Product Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="slug"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Product Slug (URL) *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g., luxe-matte-lipstick"
                        maxLength={VALIDATION_RULES.product.slug.maxLength}
                        className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                        {...field}
                        onChange={(e) => {
                          setSlugManuallyEdited(true);
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSlugManuallyEdited(false);
                        const generatedSlug = generateSlugFromName(productName || "");
                        setValue("slug", generatedSlug, { shouldValidate: true });
                      }}
                      title="Regenerate from product name"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    SEO-friendly URL: /products/{field.value || "your-product-slug"}
                    <br />
                    {field.value?.length || 0}/{VALIDATION_RULES.product.slug.maxLength} characters
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="productType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Product Type</FormLabel>
                  <Select
                    key={`productType-${field.value}`}
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="simple">Simple Product</SelectItem>
                      <SelectItem value="configurable">Configurable Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Simple products have fixed pricing and no variants. Configurable products have multiple variants (colors, sizes, etc.)
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Brand & Category (WITH HIERARCHICAL SELECT) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="brandId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <Select
                    key={`brand-${field.value}`}
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            {/* UPDATED: Hierarchical Category Select */}
            <FormField
              control={control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <HierarchicalCategorySelect
                      categories={categories}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                      error={!!(fieldState.error && fieldState.isTouched)}
                    />
                  </FormControl>
                  <FormDescription>
                    Choose a category to organize your product
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
          </div>

          {/* Row 4: Published Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <FormField
              control={control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {field.value ? (
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Published
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <EyeOff className="h-4 w-4" />
                          Draft
                        </div>
                      )}
                    </FormLabel>
                    <FormDescription>
                      {field.value
                        ? "Product will be visible to customers"
                        : "Product will be saved as draft"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={control}
          name="description"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>Product Description *</FormLabel>
              <FormControl>
                <RichTextEditor
                  content={field.value}
                  onChange={field.onChange}
                  placeholder="Describe your product's benefits, ingredients, and usage instructions..."
                />
              </FormControl>
              <FormDescription>
                Provide detailed information about the product ({field.value?.length || 0}/{VALIDATION_RULES.product.description.maxLength} characters)
              </FormDescription>
              {fieldState.error && fieldState.isTouched && (
                <FormMessage />
              )}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProductBasicInfoStep;