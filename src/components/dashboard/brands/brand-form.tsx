// src/components/dashboard/brands/brand-form.tsx
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
import { brandFormSchema, type BrandFormData } from "@/lib/validations/dashboard";
import { 
  submitBrandForm, 
  submitBrandUpdateForm,
} from "@/lib/actions/brand-management";
import { type SelectBrand } from "@/lib/db/schema";
import BrandImageUpload from "./brand-image-upload";
import { toast } from "sonner";
import { useFormStatus } from "react-dom";

interface BrandFormProps {
  mode: "create" | "edit";
  brandId?: string;
  initialData?: SelectBrand;
  initialError?: string;
  initialFieldErrors?: Record<string, string[]>;
}

// Submit button component that uses form status
function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      <Save className="h-4 w-4 mr-2" />
      {pending ? "Saving..." : isEditMode ? "Update Brand" : "Create Brand"}
    </Button>
  );
}

const BrandForm: React.FC<BrandFormProps> = ({ 
  mode, 
  brandId, 
  initialData,
  initialError,
  initialFieldErrors
}) => {
  const router = useRouter();
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Brand" : "Create Brand";

  const form = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      logoUrl: initialData?.logoUrl || null,
    },
  });

  // Watch fields for auto-generation and image handling
  const watchedName = form.watch("name");
  const watchedLogoUrl = form.watch("logoUrl");

  // Handle initial errors and field errors
  useEffect(() => {
    if (initialError) {
      toast.error(initialError);
    }
    
    if (initialFieldErrors) {
      Object.entries(initialFieldErrors).forEach(([field, errors]) => {
        form.setError(field as keyof BrandFormData, {
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

  // Auto-generate slug from name
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

  const handleLogoUrlChange = (logoUrl: string | null) => {
    form.setValue("logoUrl", logoUrl);
    form.trigger("logoUrl");
  };

  const handleCancel = () => {
    router.push("/dashboard/brands");
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
    if (isEditMode && brandId) {
      await submitBrandUpdateForm(brandId, data);
    } else {
      await submitBrandForm(data);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={
          isEditMode
            ? "Update brand information and logo"
            : "Create a new brand for your cosmetics products"
        }
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Brands
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form action={handleSubmit} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter brand name (e.g., Glamour Beauty)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the official name of the cosmetics brand
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
                              placeholder="brand-slug"
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
                          URL-friendly version of the brand name (lowercase, hyphens only).
                          Use the &quot;Generate&quot; button to create from brand name.
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

        {/* Logo Upload Sidebar */}
        <div>
          <BrandImageUpload
            logoUrl={watchedLogoUrl || null}
            onChange={handleLogoUrlChange}
            disabled={false}
          />
        </div>
      </div>
    </div>
  );
};

export default BrandForm;