// src/lib/validations/product-form.ts
import { z } from "zod";

// Business rules and constraints based on database schema
export const VALIDATION_RULES = {
  product: {
    name: {
      minLength: 1,
      maxLength: 255,
    },
    description: {
      minLength: 10,
      maxLength: 5000,
    },
  },
  variant: {
    sku: {
      minLength: 1,
      maxLength: 100,
      pattern: /^[A-Za-z0-9-]+$/,
    },
    price: {
      min: 0.01,
      max: 999999.99,
      precision: 2,
    },
    salePrice: {
      min: 0.01,
      max: 999999.99,
      precision: 2,
    },
    inStock: {
      min: 0,
      max: 999999,
    },
    weight: {
      min: 0.1,
      max: 50000, // 50kg in grams
    },
  },
  image: {
    maxImages: 20,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
} as const;

// Step 1: Basic Product Information Schema
export const basicInfoSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_RULES.product.name.minLength, "Product name is required")
    .max(VALIDATION_RULES.product.name.maxLength, `Product name must be less than ${VALIDATION_RULES.product.name.maxLength} characters`)
    .trim(),
  description: z
    .string()
    .min(VALIDATION_RULES.product.description.minLength, `Description must be at least ${VALIDATION_RULES.product.description.minLength} characters`)
    .max(VALIDATION_RULES.product.description.maxLength, `Description must be less than ${VALIDATION_RULES.product.description.maxLength} characters`)
    .trim(),
  categoryId: z
    .string()
    .optional()
    .nullable(),
  genderId: z
    .string()
    .optional()
    .nullable(),
  brandId: z
    .string()
    .optional()
    .nullable(),
  isPublished: z.boolean().default(false),
  productType: z.enum(['simple', 'configurable']).default('simple'),
});

// Simple Product Schema (for products without variants)
export const simpleProductSchema = z.object({
  sku: z
    .string()
    .min(VALIDATION_RULES.variant.sku.minLength, "SKU is required")
    .max(VALIDATION_RULES.variant.sku.maxLength, `SKU must be less than ${VALIDATION_RULES.variant.sku.maxLength} characters`)
    .regex(VALIDATION_RULES.variant.sku.pattern, "SKU can only contain letters, numbers, and hyphens")
    .trim(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= VALIDATION_RULES.variant.price.min && num <= VALIDATION_RULES.variant.price.max;
    }, `Price must be between $${VALIDATION_RULES.variant.price.min} and $${VALIDATION_RULES.variant.price.max}`)
    .refine((val) => {
      const num = parseFloat(val);
      const decimalPlaces = (val.split('.')[1] || '').length;
      return decimalPlaces <= VALIDATION_RULES.variant.price.precision;
    }, `Price can have at most ${VALIDATION_RULES.variant.price.precision} decimal places`),
  salePrice: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= VALIDATION_RULES.variant.salePrice.min && num <= VALIDATION_RULES.variant.salePrice.max;
    }, `Sale price must be between $${VALIDATION_RULES.variant.salePrice.min} and $${VALIDATION_RULES.variant.salePrice.max}`)
    .refine((val) => {
      if (!val) return true;
      const decimalPlaces = (val.split('.')[1] || '').length;
      return decimalPlaces <= VALIDATION_RULES.variant.salePrice.precision;
    }, `Sale price can have at most ${VALIDATION_RULES.variant.salePrice.precision} decimal places`),
  inStock: z
    .number()
    .int("Stock must be a whole number")
    .min(VALIDATION_RULES.variant.inStock.min, `Stock cannot be negative`)
    .max(VALIDATION_RULES.variant.inStock.max, `Stock cannot exceed ${VALIDATION_RULES.variant.inStock.max}`)
    .default(0),
  weight: z
    .union([
      z.number()
        .positive("Weight must be positive")
        .min(VALIDATION_RULES.variant.weight.min, `Weight must be at least ${VALIDATION_RULES.variant.weight.min}g`)
        .max(VALIDATION_RULES.variant.weight.max, `Weight cannot exceed ${VALIDATION_RULES.variant.weight.max}g`),
      z.null(),
      z.undefined()
    ])
    .optional()
    .nullable(),
  dimensions: z
    .union([
      z.object({
        length: z.number().positive("Length must be positive").optional(),
        width: z.number().positive("Width must be positive").optional(),
        height: z.number().positive("Height must be positive").optional(),
      }).optional(),
      z.null(),
      z.undefined()
    ])
    .optional()
    .nullable(),
});

// Step 2: Variant Schema (individual variant validation)
export const variantSchema = z.object({
  id: z.string().optional(),
  sku: z
    .string()
    .min(VALIDATION_RULES.variant.sku.minLength, "SKU is required")
    .max(VALIDATION_RULES.variant.sku.maxLength, `SKU must be less than ${VALIDATION_RULES.variant.sku.maxLength} characters`)
    .regex(VALIDATION_RULES.variant.sku.pattern, "SKU can only contain letters, numbers, and hyphens")
    .trim(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= VALIDATION_RULES.variant.price.min && num <= VALIDATION_RULES.variant.price.max;
    }, `Price must be between $${VALIDATION_RULES.variant.price.min} and $${VALIDATION_RULES.variant.price.max}`)
    .refine((val) => {
      const num = parseFloat(val);
      const decimalPlaces = (val.split('.')[1] || '').length;
      return decimalPlaces <= VALIDATION_RULES.variant.price.precision;
    }, `Price can have at most ${VALIDATION_RULES.variant.price.precision} decimal places`),
  salePrice: z
    .string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const num = parseFloat(val);
      return !isNaN(num) && num >= VALIDATION_RULES.variant.salePrice.min && num <= VALIDATION_RULES.variant.salePrice.max;
    }, `Sale price must be between $${VALIDATION_RULES.variant.salePrice.min} and $${VALIDATION_RULES.variant.salePrice.max}`)
    .refine((val) => {
      if (!val) return true;
      const decimalPlaces = (val.split('.')[1] || '').length;
      return decimalPlaces <= VALIDATION_RULES.variant.salePrice.precision;
    }, `Sale price can have at most ${VALIDATION_RULES.variant.salePrice.precision} decimal places`),
  colorId: z.string().optional().nullable(),
  sizeId: z.string().optional().nullable(),
  inStock: z
    .number()
    .int("Stock must be a whole number")
    .min(VALIDATION_RULES.variant.inStock.min, `Stock cannot be negative`)
    .max(VALIDATION_RULES.variant.inStock.max, `Stock cannot exceed ${VALIDATION_RULES.variant.inStock.max}`)
    .default(0),
  weight: z
    .number()
    .positive("Weight must be positive")
    .min(VALIDATION_RULES.variant.weight.min, `Weight must be at least ${VALIDATION_RULES.variant.weight.min}g`)
    .max(VALIDATION_RULES.variant.weight.max, `Weight cannot exceed ${VALIDATION_RULES.variant.weight.max}g`)
    .optional()
    .nullable(),
  dimensions: z
    .object({
      length: z.number().positive("Length must be positive"),
      width: z.number().positive("Width must be positive"),
      height: z.number().positive("Height must be positive"),
    })
    .partial()
    .optional()
    .nullable(),
});

// Step 2: Variants Collection Schema
export const variantsSchema = z.object({
  variants: z
    .array(variantSchema)
    .max(50, "Maximum 50 variants allowed")
    .superRefine((variants, ctx) => {
      // Check for duplicate SKUs
      const skus = variants.map(v => v.sku.toLowerCase()).filter(Boolean);
      const duplicateSkus = skus.filter((sku, index) => skus.indexOf(sku) !== index);
      if (duplicateSkus.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate SKUs found: ${[...new Set(duplicateSkus)].join(', ')}`,
          path: [],
        });
      }

      // Check for duplicate color-size combinations
      const combinations = variants.map(v => `${v.colorId}-${v.sizeId}`).filter(combo => combo !== '-');
      const duplicateCombos = combinations.filter((combo, index) => combinations.indexOf(combo) !== index);
      if (duplicateCombos.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Duplicate color-size combinations found. Each variant must have a unique color-size combination.",
          path: [],
        });
      }

      // Validate sale price vs regular price
      variants.forEach((variant, index) => {
        if (variant.salePrice && variant.price) {
          const regularPrice = parseFloat(variant.price);
          const salePrice = parseFloat(variant.salePrice);
          if (salePrice >= regularPrice) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Sale price must be less than regular price",
              path: [index, 'salePrice'],
            });
          }
        }
      });
    }),
});

// Step 3: Images Schema
export const imagesSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url("Invalid image URL"),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().nonnegative().default(0),
        variantId: z.string().optional().nullable(),
        alt: z.string().optional(),
      })
    )
    .min(1, "At least one product image is required")
    .max(VALIDATION_RULES.image.maxImages, `Maximum ${VALIDATION_RULES.image.maxImages} images allowed`)
    .superRefine((images, ctx) => {
      // Check for exactly one primary image
      const primaryImages = images.filter(img => img.isPrimary);
      if (primaryImages.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "One image must be set as primary",
          path: [],
        });
      } else if (primaryImages.length > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only one image can be set as primary",
          path: [],
        });
      }

      // Check for duplicate sort orders
      const sortOrders = images.map(img => img.sortOrder);
      const duplicateOrders = sortOrders.filter((order, index) => sortOrders.indexOf(order) !== index);
      if (duplicateOrders.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each image must have a unique sort order",
          path: [],
        });
      }
    }),
});

// Step 4: Inventory Schema (validates stock levels)
export const inventorySchema = z.object({
  variants: z
    .array(variantSchema)
    .superRefine((variants, ctx) => {
      // Business rule: At least one variant should have stock > 0 for published products
      const hasStock = variants.some(v => v.inStock > 0);
      if (!hasStock) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Warning: No variants have stock. Consider adding inventory before publishing.",
          path: [],
        });
      }
    }),
});

// Complete form schema (all steps combined)
export const completeProductFormSchema = z.object({
  // Step 1: Basic Info
  ...basicInfoSchema.shape,
  // Step 2: Simple product fields (optional for all, validated conditionally)
  sku: z.string().optional(),
  price: z.string().optional(), 
  salePrice: z.string().optional().nullable(),
  inStock: z.number().optional(),
  weight: z.union([z.number(), z.null(), z.undefined()]).optional().nullable(),
  dimensions: z.union([
    z.object({
      length: z.number().optional(),
      width: z.number().optional(), 
      height: z.number().optional(),
    }).optional(),
    z.null(),
    z.undefined()
  ]).optional().nullable(),
  // Step 2: Variants (optional, validated conditionally)
  variants: z.array(variantSchema).optional().default([]),
  // Step 3: Images
  ...imagesSchema.shape,
}).superRefine((data, ctx) => {
  // Validate based on product type
  if (data.productType === 'simple') {
    // For simple products, require simple product fields
    const simpleValidation = simpleProductSchema.safeParse(data);
    if (!simpleValidation.success) {
      simpleValidation.error.issues.forEach(issue => {
        ctx.addIssue({
          ...issue,
          path: issue.path,
        });
      });
    }
  } else if (data.productType === 'configurable') {
    // For configurable products, require at least one variant
    if (!data.variants || data.variants.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Configurable products must have at least one variant",
        path: ['variants'],
      });
    }
    
    // Validate variants array
    const variantsValidation = variantsSchema.safeParse({ variants: data.variants });
    if (!variantsValidation.success) {
      variantsValidation.error.issues.forEach(issue => {
        ctx.addIssue({
          ...issue,
          path: issue.path,
        });
      });
    }
  }
});

// Export types
export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type SimpleProductData = z.infer<typeof simpleProductSchema>;
export type VariantData = z.infer<typeof variantSchema>;
export type VariantsData = z.infer<typeof variantsSchema>;
export type ImagesData = z.infer<typeof imagesSchema>;
export type InventoryData = z.infer<typeof inventorySchema>;
export type CompleteProductFormData = z.infer<typeof completeProductFormSchema>;

// Step validation functions
export const validateStep = {
  basic: (data: Partial<BasicInfoData>) => basicInfoSchema.safeParse(data),
  simple: (data: Partial<SimpleProductData>) => simpleProductSchema.safeParse(data),
  variants: (data: Partial<VariantsData>) => variantsSchema.safeParse(data),
  images: (data: Partial<ImagesData>) => imagesSchema.safeParse(data),
  inventory: (data: Partial<InventoryData>) => inventorySchema.safeParse(data),
};

// Helper function to check if step can be accessed
export const canAccessStep = (stepIndex: number, formData: any): boolean => {
  const isSimpleProduct = formData.productType === 'simple';
  const basicValid = validateStep.basic(formData).success;
  
  switch (stepIndex) {
    case 0: // Basic Info - always accessible
      return true;
    case 1: // Variants/Pricing - requires basic info to be valid
      return basicValid;
    case 2: // Images - requires step 1 to be valid
      if (isSimpleProduct) {
        return basicValid && validateStep.simple(formData).success;
      } else {
        return basicValid && validateStep.variants(formData).success;
      }
    case 3: // Inventory (only for configurable products) - requires images to be valid
      if (isSimpleProduct) {
        return false; // Simple products don't have inventory step
      }
      const step1Valid = validateStep.variants(formData).success;
      return basicValid && step1Valid && validateStep.images(formData).success;
    default:
      return false;
  }
};

// Helper function to check if step is completed
export const isStepCompleted = (stepIndex: number, formData: any): boolean => {
  const isSimpleProduct = formData.productType === 'simple';
  
  switch (stepIndex) {
    case 0:
      return validateStep.basic(formData).success;
    case 1:
      if (isSimpleProduct) {
        return validateStep.simple(formData).success;
      } else {
        return validateStep.variants(formData).success;
      }
    case 2:
      return validateStep.images(formData).success;
    case 3:
      if (isSimpleProduct) {
        return false; // Simple products don't have this step
      }
      return validateStep.inventory(formData).success;
    default:
      return false;
  }
};
