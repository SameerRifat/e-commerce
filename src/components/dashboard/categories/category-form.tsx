// src/components/dashboard/categories/category-form.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/dashboard/page-header";
import HierarchicalCategorySelect from "@/components/dashboard/hierarchical-category-select";
import { categoryFormSchema, type CategoryFormData } from "@/lib/validations/dashboard";
import { 
  submitCategoryForm, 
  submitCategoryUpdateForm, 
  type CategoryWithHierarchy 
} from "@/lib/actions/category-management";
import { type SelectCategory } from "@/lib/db/schema";
import CategoryImageUpload from "./category-image-upload";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

interface CategoryFormProps {
  mode: "create" | "edit";
  categoryId?: string;
  initialData?: SelectCategory;
  availableParentCategories: CategoryWithHierarchy[];
  initialError?: string;
  initialFieldErrors?: Record<string, string[]>;
}

// Submit button component that uses form status
function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Saving..." : isEditMode ? "Update Category" : "Create Category"}
    </Button>
  );
}

const CategoryForm: React.FC<CategoryFormProps> = ({ 
  mode, 
  categoryId, 
  initialData,
  availableParentCategories,
  initialError,
  initialFieldErrors
}) => {
  const router = useRouter();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Category" : "Create Category";

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      parentId: initialData?.parentId || null,
      imageUrl: initialData?.imageUrl || null,
    },
  });

  // Watch fields for reactivity
  const watchedName = form.watch("name");
  const watchedParentId = form.watch("parentId");
  const watchedImageUrl = form.watch("imageUrl");

  // Determine if category is top-level (no parent selected)
  const isTopLevelCategory = watchedParentId === null || watchedParentId === undefined;

  // Handle initial errors and field errors
  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
    
    if (initialFieldErrors) {
      Object.entries(initialFieldErrors).forEach(([field, errors]) => {
        form.setError(field as keyof CategoryFormData, {
          message: errors.join(', '),
        });
      });
    }
  }, [initialError, initialFieldErrors, form]);

  // Set slug as manually edited if in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      setIsSlugManuallyEdited(true);
    }
  }, [isEditMode, initialData]);

  // Enhanced slug generation function
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .replace(/-{2,}/g, "-");
  };

  // Auto-generate slug from name (only in create mode)
  useEffect(() => {
    if (!isEditMode && !isSlugManuallyEdited && watchedName) {
      const newSlug = generateSlug(watchedName);
      form.setValue("slug", newSlug);
    }
  }, [watchedName, isEditMode, isSlugManuallyEdited, form]);

  const handleGenerateSlug = () => {
    const currentName = form.getValues("name");
    if (currentName.trim()) {
      const newSlug = generateSlug(currentName);
      form.setValue("slug", newSlug);
      form.trigger("slug");
      setIsSlugManuallyEdited(false);
    }
  };

  const handleSlugInputChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    form.setValue("slug", value);
  };

  const handleImageUrlChange = (imageUrl: string | null) => {
    form.setValue("imageUrl", imageUrl);
    form.trigger("imageUrl");
  };

  const handleParentChange = (parentId: string | null) => {
    form.setValue("parentId", parentId);
    // Trigger imageUrl validation when parent changes (to show/hide required message)
    form.trigger("imageUrl");
  };

  const handleCancel = () => {
    router.push("/dashboard/categories");
  };

  // Server action handler
  const handleSubmit = async (formData: FormData) => {
    // Client-side validation first
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const data = form.getValues();

    // Call server action - this will either redirect on success or redirect with errors
    if (isEditMode && categoryId) {
      await submitCategoryUpdateForm(categoryId, data);
    } else {
      await submitCategoryForm(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={
          isEditMode
            ? "Update category information, hierarchy, and image. Categories are limited to 3 levels."
            : "Create a new category to organize your products with visual navigation. Categories are limited to 3 levels."
        }
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Categories
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form action={handleSubmit} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter category name (e.g., Foundation)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a clear, descriptive name for your category
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="category-slug"
                              {...field}
                              onChange={(e) => handleSlugInputChange(e.target.value)}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateSlug}
                            disabled={!watchedName?.trim()}
                            className="flex-shrink-0 px-3"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate
                          </Button>
                        </div>
                        <FormDescription>
                          URL-friendly version of the category name (lowercase, hyphens only).
                          Use the &quot;Generate&quot; button to create from category name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel>Parent Category (optional)</FormLabel>
                        <FormControl>
                          <HierarchicalCategorySelect
                            categories={availableParentCategories}
                            value={field.value}
                            onValueChange={handleParentChange}
                            placeholder="Select parent category (or leave as root)"
                            error={!!(fieldState.error && fieldState.isTouched)}
                            allowEmpty={true}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty to create a root category (Level 1), or select a parent to create a subcategory.
                          Only Level 1-2 categories are shown as parents to maintain the 3-level hierarchy limit.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-4 pt-6 border-t">
                    <Button type="button" variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <SubmitButton isEditMode={isEditMode} />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div>
          <CategoryImageUpload
            imageUrl={watchedImageUrl || null}
            onChange={handleImageUrlChange}
            disabled={false}
            isRequired={isTopLevelCategory}
            error={form.formState.errors.imageUrl?.message}
          />
        </div>
      </div>
    </div>
  );
};

export default CategoryForm;