// src/components/dashboard/collections/collection-form-schema.ts
// Simplified form schema aligned with database schema
// Removed unused fields: collectionType, automationRules, scheduling

import { z } from "zod";

export const collectionFormSchema = z.object({
    name: z.string().min(1, "Collection name is required"),
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(
            /^[a-z0-9-]+$/,
            "Slug must contain only lowercase letters, numbers, and hyphens"
        ),
    description: z.string().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    thumbnailUrl: z.string().url().optional().or(z.literal("")),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
});

export type CollectionFormData = z.infer<typeof collectionFormSchema>;
