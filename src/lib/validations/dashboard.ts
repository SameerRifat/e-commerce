// src/lib/validations/dashboard.ts
import { z } from "zod";

// Product validation schemas
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255, "Product name is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Invalid category").optional().nullable(),
  genderId: z.string().min(1, "Invalid gender").optional().nullable(),
  brandId: z.string().min(1, "Invalid brand").optional().nullable(),
  isPublished: z.boolean(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// Variant validation schemas
export const variantFormSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100, "SKU is too long"),
  price: z.string().min(1, "Price is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Price must be a positive number"),
  salePrice: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Sale price must be a positive number"),
  colorId: z.string().uuid("Invalid color"),
  sizeId: z.string().uuid("Invalid size"),
  inStock: z.number().int().nonnegative("Stock must be non-negative").default(0),
  weight: z.number().positive("Weight must be positive").optional().nullable(),
  dimensions: z.object({
    length: z.number().positive("Length must be positive"),
    width: z.number().positive("Width must be positive"),
    height: z.number().positive("Height must be positive"),
  }).partial().optional().nullable(),
});

export type VariantFormData = z.infer<typeof variantFormSchema>;

// Brand validation schemas - UPDATED: Removed manual logoUrl input
export const brandFormSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100, "Brand name is too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  logoUrl: z.string().url("Invalid URL").optional().nullable(), // Keep in schema for backend processing
});

export type BrandFormData = z.infer<typeof brandFormSchema>;

// Category validation schemas - UPDATED: Added imageUrl field
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Category name is too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  parentId: z.string().uuid("Invalid parent category").optional().nullable(),
  imageUrl: z.string().url("Invalid URL").optional().nullable(), // New field for category images
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

// Collection validation schemas
export const collectionFormSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100, "Collection name is too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

export type CollectionFormData = z.infer<typeof collectionFormSchema>;

// Color validation schemas
export const colorFormSchema = z.object({
  name: z.string().min(1, "Color name is required").max(50, "Color name is too long"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code (e.g., #FF5733)"),
});

export type ColorFormData = z.infer<typeof colorFormSchema>;

// Size validation schemas
export const sizeFormSchema = z.object({
  name: z.string().min(1, "Size name is required").max(20, "Size name is too long"),
  slug: z.string().min(1, "Slug is required").max(20, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  sortOrder: z.number().int("Sort order must be an integer"),
  categoryId: z.string().uuid("Invalid category").optional().nullable(),
});

export type SizeFormData = z.infer<typeof sizeFormSchema>;

// Size category validation schemas
export const sizeCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name is too long"),
});

export type SizeCategoryFormData = z.infer<typeof sizeCategoryFormSchema>;

// Image upload schemas
export const imageUploadSchema = z.object({
  id: z.string(),
  url: z.string(), // Can be URL or blob URL for preview
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
  variantId: z.string().uuid().optional().nullable(),
  alt: z.string().optional(),
  // Optional fields for deferred upload
  file: z.instanceof(File).optional(),
  isUploading: z.boolean().optional(),
  uploadProgress: z.number().min(0).max(100).optional(),
});

export type ImageUploadData = z.infer<typeof imageUploadSchema>;

// Gender validation schemas (for reference)
export const genderFormSchema = z.object({
  label: z.string().min(1, "Gender label is required").max(50, "Gender label is too long"),
  slug: z.string().min(1, "Slug is required").max(50, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens only"),
});

export type GenderFormData = z.infer<typeof genderFormSchema>;