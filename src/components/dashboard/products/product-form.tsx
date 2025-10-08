// src/components/dashboard/product-form.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/dashboard/page-header";
import RichTextEditor from "@/components/dashboard/rich-text-editor";
import ImageUpload from "@/components/dashboard/image-upload";
import { productFormSchema, type ProductFormData } from "@/lib/validations/dashboard";
import { ImageUploadData } from "@/lib/validations/dashboard";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
}

// Mock data for dropdowns
const mockBrands = [
  { id: "1", name: "Glamour Beauty", slug: "glamour-beauty" },
  { id: "2", name: "Pure Skin", slug: "pure-skin" },
  { id: "3", name: "Color Pop", slug: "color-pop" },
  { id: "4", name: "Luxury Cosmetics", slug: "luxury-cosmetics" },
];

const mockCategories = [
  { id: "1", name: "Lipstick", slug: "lipstick" },
  { id: "2", name: "Foundation", slug: "foundation" },
  { id: "3", name: "Eyeshadow", slug: "eyeshadow" },
  { id: "4", name: "Serum", slug: "serum" },
  { id: "5", name: "Moisturizer", slug: "moisturizer" },
];

const mockGenders = [
  { id: "1", label: "Women", slug: "women" },
  { id: "2", label: "Men", slug: "men" },
  { id: "3", label: "Unisex", slug: "unisex" },
];

// Mock product data for edit mode
const mockProductData = {
  id: "1",
  name: "Luxe Matte Lipstick",
  description: `<p>Experience the ultimate in lip luxury with our <strong>Luxe Matte Lipstick</strong>. This revolutionary formula delivers:</p>
    <ul>
      <li>Full-coverage, long-lasting color that won't fade</li>
      <li>Comfortable matte finish that doesn't dry out lips</li>
      <li>Rich, highly pigmented shades for every occasion</li>
      <li>Infused with vitamin E and jojoba oil for nourishment</li>
    </ul>
    <p>Perfect for creating bold, statement looks that last all day.</p>`,
  brandId: "1",
  categoryId: "1",
  genderId: "1",
  isPublished: true,
  images: [
    {
      id: "i1",
      url: "/static/uploads/cosmetics/lipstick-1.jpg",
      isPrimary: true,
      sortOrder: 0,
      variantId: null,
    },
    {
      id: "i2",
      url: "/static/uploads/cosmetics/lipstick-2.jpg",
      isPrimary: false,
      sortOrder: 1,
      variantId: null,
    },
  ] as ImageUploadData[],
};

const ProductForm: React.FC<ProductFormProps> = ({ mode, productId }) => {
  const router = useRouter();
  const [images, setImages] = useState<ImageUploadData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Edit Product" : "Create Product";

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: null,
      genderId: null,
      brandId: null,
      isPublished: false,
    },
  });

  // Load product data for edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      // In a real app, you'd fetch the product data from API
      const productData = mockProductData;
      
      form.reset({
        name: productData.name,
        description: productData.description,
        brandId: productData.brandId,
        categoryId: productData.categoryId,
        genderId: productData.genderId,
        isPublished: productData.isPublished,
      });
      
      setImages(productData.images);
    }
  }, [isEditMode, productId, form]);

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    
    try {
      // In a real app, you'd call your API here
      console.log("Submitting product:", { ...data, images });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Redirect to products list
      router.push("/dashboard/products");
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/products");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={
          isEditMode
            ? "Update your product information and settings"
            : "Add a new product to your cosmetics catalog"
        }
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </PageHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField<ProductFormData>
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter product name (e.g., Luxe Matte Lipstick)"
                            {...field}
                            value={typeof field.value === "string" ? field.value : ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Choose a descriptive name that highlights the product&apos;s key features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField<ProductFormData>
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <RichTextEditor
                            content={typeof field.value === "string" ? field.value : ""}
                            onChange={field.onChange}
                            placeholder="Describe your product's benefits, ingredients, and usage instructions..."
                          />
                        </FormControl>
                        <FormDescription>
                          Provide detailed information about the product, including key benefits, ingredients, and usage instructions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Product Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    images={images}
                    onChange={setImages}
                    maxImages={10}
                  />
                  <p className="text-sm text-gray-500 mt-4">
                    Upload high-quality images that showcase your product. The first image will be used as the primary image.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publication Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Publication</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField<ProductFormData>
                    control={form.control}
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
                              ? "Product is visible to customers"
                              : "Product is saved as draft"}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={!!field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField<ProductFormData>
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            // Handle clearing the selection
                            if (value === "none") {
                              field.onChange(null);
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={typeof field.value === "string" ? field.value : "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No brand</SelectItem>
                            {mockBrands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField<ProductFormData>
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            // Handle clearing the selection
                            if (value === "none") {
                              field.onChange(null);
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={typeof field.value === "string" ? field.value : "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No category</SelectItem>
                            {mockCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField<ProductFormData>
                    control={form.control}
                    name="genderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Gender</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            // Handle clearing the selection
                            if (value === "none") {
                              field.onChange(null);
                            } else {
                              field.onChange(value);
                            }
                          }}
                          value={typeof field.value === "string" ? field.value : "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No preference</SelectItem>
                            {mockGenders.map((gender) => (
                              <SelectItem key={gender.id} value={gender.id}>
                                {gender.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Saving..." : isEditMode ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;