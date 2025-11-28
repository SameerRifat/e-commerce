// src/lib/db/schema/collections.ts (ENHANCED VERSION)
import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),

  // Visual assets
  imageUrl: text('image_url'), // Hero image for collection page
  thumbnailUrl: text('thumbnail_url'), // Smaller image for cards/grid

  // Display & Publishing
  isPublished: boolean('is_published').notNull().default(false),
  isFeatured: boolean('is_featured').notNull().default(false), // Show in navbar/homepage
  displayOrder: integer('display_order').notNull().default(0),

  // Collection type
  collectionType: text('collection_type').notNull().default('manual'), // 'manual' | 'automated'

  // Automated collection rules (for smart collections)
  automationRules: jsonb('automation_rules'),
  /* Example structure:
  {
    conditions: 'AND' | 'OR',
    rules: [
      { field: 'categoryId', operator: 'equals', value: 'uuid' },
      { field: 'brandId', operator: 'in', value: ['uuid1', 'uuid2'] },
      { field: 'price', operator: 'lte', value: 50 },
      { field: 'createdAt', operator: 'gte', value: '2024-01-01' }
    ]
  }
  */

  // SEO
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),

  // Scheduling (like hero slides)
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Product-Collection junction (many-to-many)
export const productCollections = pgTable('product_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  collectionId: uuid('collection_id').references(() => collections.id, { onDelete: 'cascade' }).notNull(),
  sortOrder: integer('sort_order').default(0), // Manual ordering within collection
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

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

// Zod Schemas
export const insertCollectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  thumbnailUrl: z.string().url().optional().nullable(),
  isPublished: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
  collectionType: z.enum(['manual', 'automated']).default('manual'),
  automationRules: z.object({
    conditions: z.enum(['AND', 'OR']),
    rules: z.array(z.object({
      field: z.string(),
      operator: z.string(),
      value: z.any(),
    })),
  }).optional().nullable(),
  metaTitle: z.string().max(60).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
  publishedAt: z.date().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.publishedAt && data.expiresAt && data.expiresAt <= data.publishedAt) {
      return false;
    }
    return true;
  },
  {
    message: 'Expiration date must be after published date',
    path: ['expiresAt'],
  }
);

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
  collectionType: z.string(),
  automationRules: z.any().nullable(),
  metaTitle: z.string().nullable(),
  metaDescription: z.string().nullable(),
  publishedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type SelectCollection = z.infer<typeof selectCollectionSchema>;