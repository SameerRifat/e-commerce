// src/lib/db/schema/products.ts
import { pgTable, text, timestamp, uuid, boolean, numeric, integer, real, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { categories } from './categories';
import { genders } from './filters/genders';
import { brands } from './brands';
import { productVariants } from './variants';
import { productImages } from './images';
import { reviews } from './reviews';
import { wishlists } from './wishlists';
import { cartItems } from './carts';
import { orderItems } from './orders';
import { productCollections } from './collections';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  genderId: uuid('gender_id').references(() => genders.id, { onDelete: 'set null' }),
  brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
  isPublished: boolean('is_published').notNull().default(false),
  
  // Product type: 'simple' or 'configurable'
  productType: text('product_type').notNull().default('simple'),
  
  // For simple products - store pricing and inventory directly
  price: numeric('price', { precision: 10, scale: 2 }),
  salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
  sku: text('sku'),
  inStock: integer('in_stock').default(0),
  weight: real('weight'),
  dimensions: jsonb('dimensions'),
  
  defaultVariantId: uuid('default_variant_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  gender: one(genders, {
    fields: [products.genderId],
    references: [genders.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  productCollections: many(productCollections),
}));

// Helper function to generate slug from product name
export function generateProductSlug(name: string, id?: string): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .substring(0, 100);        // Limit length
  
  // Optionally append short ID for uniqueness guarantee
  if (id) {
    const shortId = id.split('-')[0]; // First segment of UUID
    return `${baseSlug}-${shortId}`;
  }
  
  return baseSlug;
}

// Updated Zod schemas
export const insertProductSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'), // ADD THIS
  description: z.string().min(1),
  categoryId: z.string().uuid().optional().nullable(),
  genderId: z.string().uuid().optional().nullable(),
  brandId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
  productType: z.enum(['simple', 'configurable']).optional(),
  
  // Simple product fields
  price: z.string().optional().nullable(),
  salePrice: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  inStock: z.number().int().nonnegative().optional().nullable(),
  weight: z.number().optional().nullable(),
  dimensions: z
    .object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .partial()
    .optional()
    .nullable(),
  
  defaultVariantId: z.string().uuid().optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const selectProductSchema = insertProductSchema.extend({
  id: z.string().uuid(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type SelectProduct = z.infer<typeof selectProductSchema>;