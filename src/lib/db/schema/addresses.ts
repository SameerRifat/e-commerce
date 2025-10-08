// src/lib/db/schema/addresses.ts
import { pgEnum, pgTable, text, uuid, boolean, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

// Import validation schemas from shared location
export {
  addressFormSchema,
  insertAddressSchema,
  updateAddressSchema,
  type AddressFormValues,
  type InsertAddressInput,
  type UpdateAddressInput,
} from '@/lib/validations/address-validation';

export const addressTypeEnum = pgEnum('address_type', ['shipping', 'billing']);

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: addressTypeEnum('type').notNull(),
  fullName: text('full_name').notNull(),
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  cityId: integer('city_id'),
  state: text('state').notNull(),
  stateId: integer('state_id'),
  country: text('country').notNull().default('Pakistan'),
  countryCode: text('country_code').notNull().default('PK'),
  countryId: integer('country_id').notNull().default(167),
  postalCode: text('postal_code').notNull(),
  phone: text('phone'),
  isDefault: boolean('is_default').notNull().default(false),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// Type for selecting from database
export type SelectAddress = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;
