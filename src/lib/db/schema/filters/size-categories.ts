// src/lib/db/schema/filters/size-categories.ts
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { relations } from 'drizzle-orm';
import { sizes } from './sizes';

export const sizeCategories = pgTable('size_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sizeCategoriesRelations = relations(sizeCategories, ({ many }) => ({
  sizes: many(sizes),
}));

export const insertSizeCategorySchema = z.object({
  name: z.string().min(1).max(50),
});

export const selectSizeCategorySchema = insertSizeCategorySchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export type InsertSizeCategory = z.infer<typeof insertSizeCategorySchema>;
export type SelectSizeCategory = z.infer<typeof selectSizeCategorySchema>;
