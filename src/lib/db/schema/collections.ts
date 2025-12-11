// src/lib/db/schema/collections.ts
import { pgTable, text, timestamp, uuid, boolean, integer, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Visual assets
  imageUrl: text('image_url'),
  thumbnailUrl: text('thumbnail_url'),

  // Display & Publishing
  isPublished: boolean('is_published').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false),
  displayOrder: integer('display_order').notNull().default(0),

  // SEO
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance - critical for production
  slugIdx: index('idx_collections_slug').on(table.slug),
  featuredIdx: index('idx_collections_featured').on(table.isFeatured, table.isPublished, table.displayOrder),
  publishedOrderIdx: index('idx_collections_published_order').on(table.isPublished, table.displayOrder),
}));

// Product-Collection junction (many-to-many)
// Standard e-commerce pattern: Shopify's "collects", WooCommerce's term_relationships
export const productCollections = pgTable('product_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').default(0), // Manual ordering within collection
  addedAt: timestamp('added_at').defaultNow().notNull(),
}, (table) => ({
  // Indexes for junction table queries
  collectionSortIdx: index('idx_product_collections_collection_sort').on(table.collectionId, table.sortOrder),
  productIdx: index('idx_product_collections_product').on(table.productId),
  // Unique constraint to prevent duplicate product assignments
  uniqueProductPerCollection: unique('unique_product_per_collection').on(table.collectionId, table.productId),
}));

// Relations
export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
}));

// Zod Schemas - Simplified
export const insertCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().optional(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});

export const selectCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
  displayOrder: z.number(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type SelectCollection = z.infer<typeof selectCollectionSchema>;
