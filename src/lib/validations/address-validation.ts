// src/lib/validations/address-validation.ts
import { z } from 'zod';

export const addressFormSchema = z.object({
  type: z.enum(['shipping', 'billing'], {
    message: 'Please select an address type',
  }),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  line1: z
    .string()
    .min(1, 'Street address is required')
    .min(5, 'Please enter a complete address')
    .max(200, 'Address is too long'),
  line2: z.string().max(200, 'Address is too long').or(z.literal('')),
  stateId: z
    .number({
      message: 'Please select a valid state',
    })
    .int()
    .positive('Please select a valid state'),
  state: z.string().min(1, 'State name is required'),
  cityId: z
    .number({
      message: 'Please select a valid city',
    })
    .int()
    .positive('Please select a valid city'),
  city: z.string().min(1, 'City name is required'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .regex(/^\d+$/, 'Postal code must contain only digits')
    .length(5, 'Postal code must be exactly 5 digits'),
  phone: z
    .string()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true;
        const cleaned = val.replace(/[\s-]/g, '');
        return /^(\+92|0)?3\d{9}$/.test(cleaned);
      },
      {
        message: 'Invalid phone format (e.g., +92 300 1234567 or 03001234567)',
      }
    ),
  country: z.string(),
  countryCode: z.string().length(2),
  countryId: z.number().int().positive(),
  isDefault: z.boolean(),
});

// Rest of the file remains the same...
export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const insertAddressSchema = addressFormSchema.extend({
  userId: z.string().uuid('Invalid user ID'),
});

export const updateAddressSchema = addressFormSchema.extend({
  userId: z.string().uuid('Invalid user ID'),
  id: z.string().uuid('Invalid address ID'),
});

export type InsertAddressInput = z.infer<typeof insertAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;