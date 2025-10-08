// src/lib/db/schema/orders.ts
import { pgEnum, pgTable, uuid, timestamp, numeric, integer, text, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { z } from 'zod';
import { users } from './user';
import { addresses } from './addresses';
import { productVariants } from './variants';
import { products } from './products';

export const orderStatusEnum = pgEnum('order_status', 
  ['pending', 'processing', 'paid', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  status: orderStatusEnum('status').notNull().default('pending'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  shippingAddressId: uuid('shipping_address_id').references(() => addresses.id, { onDelete: 'set null' }),
  billingAddressId: uuid('billing_address_id').references(() => addresses.id, { onDelete: 'set null' }),
  paymentMethod: text('payment_method').notNull().default('cod'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'restrict' }),
  productVariantId: uuid('product_variant_id').references(() => productVariants.id, { onDelete: 'restrict' }),
  isSimpleProduct: boolean('is_simple_product').notNull().default(false),
  quantity: integer('quantity').notNull().default(1),
  priceAtPurchase: numeric('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
  salePriceAtPurchase: numeric('sale_price_at_purchase', { precision: 10, scale: 2 }),
});

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  shippingAddress: one(addresses, {
    fields: [orders.shippingAddressId],
    references: [addresses.id],
  }),
  billingAddress: one(addresses, {
    fields: [orders.billingAddressId],
    references: [addresses.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.productVariantId],
    references: [productVariants.id],
  }),
}));

export const insertOrderSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'processing', 'paid', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']).optional(),
  totalAmount: z.number(),
  subtotal: z.number(),
  shippingCost: z.number().default(0),
  taxAmount: z.number().default(0),
  shippingAddressId: z.string().uuid().optional().nullable(),
  billingAddressId: z.string().uuid().optional().nullable(),
  paymentMethod: z.string().default('cod'),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export const selectOrderSchema = insertOrderSchema.extend({
  id: z.string().uuid(),
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type SelectOrder = z.infer<typeof selectOrderSchema>;

export const insertOrderItemSchema = z.object({
  orderId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  productVariantId: z.string().uuid().optional(),
  isSimpleProduct: z.boolean().default(false),
  quantity: z.number().int().min(1),
  priceAtPurchase: z.number(),
  salePriceAtPurchase: z.number().optional(),
});
export const selectOrderItemSchema = insertOrderItemSchema.extend({
  id: z.string().uuid(),
});
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type SelectOrderItem = z.infer<typeof selectOrderItemSchema>;
