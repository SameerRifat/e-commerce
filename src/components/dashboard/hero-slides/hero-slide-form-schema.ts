// src/components/dashboard/hero-slides/hero-slide-form-schema.ts
import { z } from "zod";

export const heroSlideFormSchema = z.object({
    title: z.string().optional(),
    altText: z.string().max(200).optional(),
    description: z.string().max(500).optional(),
    isPublished: z.boolean(),
    linkType: z.enum(["product", "collection", "external", "none"]),
    linkedProductId: z.string().uuid().optional().nullable(),
    linkedCollectionId: z.string().uuid().optional().nullable(),
    externalUrl: z.string().url().optional().nullable().or(z.literal("")),
    desktopMediaUrl: z.string().min(1, "Desktop media is required"),
    desktopMediaType: z.enum(["image", "video"]),
    mobileMediaUrl: z.string().min(1, "Mobile media is required"),
    mobileMediaType: z.enum(["image", "video"]),
}).superRefine((data, ctx) => {
    if (data.linkType === "product" && !data.linkedProductId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a product",
            path: ["linkedProductId"],
        });
    }
    if (data.linkType === "collection" && !data.linkedCollectionId) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please select a collection",
            path: ["linkedCollectionId"],
        });
    }
    if (data.linkType === "external" && !data.externalUrl) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please enter an external URL",
            path: ["externalUrl"],
        });
    }
});

export type HeroSlideFormData = z.infer<typeof heroSlideFormSchema>;

export interface MediaUploadState {
    file?: File;
    preview?: string;
    url?: string;
    type?: "image" | "video";
}