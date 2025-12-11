// src/components/dashboard/video-carousel/video-carousel-item-form-schema.ts
import { z } from "zod";

// Simplified form schema - only video and product selection
export const videoCarouselItemFormSchema = z.object({
    isPublished: z.boolean(),
    linkedProductId: z.string().uuid("Please select a product").min(1, "Please select a product"),
    videoUrl: z.string().min(1, "Video is required"),
});

export type VideoCarouselItemFormData = z.infer<typeof videoCarouselItemFormSchema>;

export interface MediaUploadState {
    file?: File;
    preview?: string;
    url?: string;
    type?: "video";
}
