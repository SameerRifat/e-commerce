// src/lib/db/schema/hero-slides.ts
import { pgTable, text, timestamp, uuid, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';
import { collections } from './collections';

// Enum for media types
export const heroMediaTypeEnum = pgEnum('hero_media_type', ['image', 'video']);

// Enum for link target types (polymorphic association)
export const heroLinkTypeEnum = pgEnum('hero_link_type', ['product', 'collection', 'external', 'none']);

// Main hero slides table
export const heroSlides = pgTable('hero_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Display settings
  title: text('title'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),
  
  // Desktop media
  desktopMediaType: heroMediaTypeEnum('desktop_media_type').notNull(),
  desktopMediaUrl: text('desktop_media_url').notNull(),
  
  // Mobile media
  mobileMediaType: heroMediaTypeEnum('mobile_media_type').notNull(),
  mobileMediaUrl: text('mobile_media_url').notNull(),
  
  // Polymorphic link association
  linkType: heroLinkTypeEnum('link_type').notNull().default('none'),
  linkedProductId: uuid('linked_product_id').references(() => products.id, { onDelete: 'set null' }),
  linkedCollectionId: uuid('linked_collection_id').references(() => collections.id, { onDelete: 'set null' }),
  externalUrl: text('external_url'),
  
  // Metadata
  altText: text('alt_text'),
  description: text('description'),
  
  // Schedule publishing
  publishedAt: timestamp('published_at'),
  expiresAt: timestamp('expires_at'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const heroSlidesRelations = relations(heroSlides, ({ one }) => ({
  linkedProduct: one(products, {
    fields: [heroSlides.linkedProductId],
    references: [products.id],
  }),
  linkedCollection: one(collections, {
    fields: [heroSlides.linkedCollectionId],
    references: [collections.id],
  }),
}));

// Zod validation schemas
export const insertHeroSlideSchema = z.object({
  title: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(false),
  
  // Desktop media
  desktopMediaType: z.enum(['image', 'video']),
  desktopMediaUrl: z.string().url('Desktop media URL must be valid'),
  
  // Mobile media
  mobileMediaType: z.enum(['image', 'video']),
  mobileMediaUrl: z.string().url('Mobile media URL must be valid'),
  
  // Link configuration with validation
  linkType: z.enum(['product', 'collection', 'external', 'none']).default('none'),
  linkedProductId: z.string().uuid().optional().nullable(),
  linkedCollectionId: z.string().uuid().optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  
  // Metadata
  altText: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  
  // Scheduling
  publishedAt: z.date().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.linkType === 'product' && !data.linkedProductId) {
      return false;
    }
    if (data.linkType === 'collection' && !data.linkedCollectionId) {
      return false;
    }
    if (data.linkType === 'external' && !data.externalUrl) {
      return false;
    }
    return true;
  },
  {
    message: 'Link configuration is invalid. Ensure the correct entity is linked for the selected link type.',
    path: ['linkType'],
  }
).refine(
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

// FIXED: Define selectHeroSlideSchema separately (no extend on refined schemas)
export const selectHeroSlideSchema = z.object({
  id: z.string().uuid(),
  title: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative(),
  isPublished: z.boolean(),
  desktopMediaType: z.enum(['image', 'video']),
  desktopMediaUrl: z.string().url(),
  mobileMediaType: z.enum(['image', 'video']),
  mobileMediaUrl: z.string().url(),
  linkType: z.enum(['product', 'collection', 'external', 'none']),
  linkedProductId: z.string().uuid().optional().nullable(),
  linkedCollectionId: z.string().uuid().optional().nullable(),
  externalUrl: z.string().url().optional().nullable(),
  altText: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  publishedAt: z.date().optional().nullable(),
  expiresAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type SelectHeroSlide = z.infer<typeof selectHeroSlideSchema>;