// src/lib/db/schema/video-carousel-items.ts
import { pgTable, text, timestamp, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { products } from './products';

// Simplified video carousel items table
// Only stores video-specific data; product data (name, price, thumbnail) fetched via JOIN
export const videoCarouselItems = pgTable('video_carousel_items', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Display settings
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(false),

  // Video media
  videoUrl: text('video_url').notNull(),

  // Product reference (REQUIRED - always links to a product)
  linkedProductId: uuid('linked_product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const videoCarouselItemsRelations = relations(videoCarouselItems, ({ one }) => ({
  linkedProduct: one(products, {
    fields: [videoCarouselItems.linkedProductId],
    references: [products.id],
  }),
}));

// Zod validation schemas
export const insertVideoCarouselItemSchema = z.object({
  sortOrder: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(false),
  videoUrl: z.string().url('Video URL must be valid'),
  linkedProductId: z.string().uuid('Product is required'),
});

export const selectVideoCarouselItemSchema = z.object({
  id: z.string().uuid(),
  sortOrder: z.number().int().nonnegative(),
  isPublished: z.boolean(),
  videoUrl: z.string().url(),
  linkedProductId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type InsertVideoCarouselItem = z.infer<typeof insertVideoCarouselItemSchema>;
export type SelectVideoCarouselItem = z.infer<typeof selectVideoCarouselItemSchema>;
