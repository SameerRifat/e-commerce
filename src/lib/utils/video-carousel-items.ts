// src/lib/utils/video-carousel-items.ts
import { SelectVideoCarouselItem } from "@/lib/db/schema/video-carousel-items";

/**
 * Validates if a video file meets video carousel requirements
 */
export function validateVideoCarouselVideo(
    file: File
): { valid: boolean; error?: string } {
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    const isVideo = file.type.startsWith("video/");

    if (!isVideo) {
        return { valid: false, error: "File must be a video" };
    }

    if (file.size > maxVideoSize) {
        return {
            valid: false,
            error: `Video size must be less than ${maxVideoSize / (1024 * 1024)}MB`,
        };
    }

    return { valid: true };
}

/**
 * Format item data for analytics tracking
 */
export function formatVideoCarouselItemForAnalytics(item: SelectVideoCarouselItem) {
    return {
        item_id: item.id,
        linked_product_id: item.linkedProductId,
        is_published: item.isPublished,
        sort_order: item.sortOrder,
    };
}

/**
 * Generate a cache key for video carousel items
 */
export function getVideoCarouselItemsCacheKey(
    filters: {
        published?: boolean;
    } = {}
): string {
    const parts = ["video-carousel-items"];

    if (filters.published !== undefined) {
        parts.push(`published-${filters.published}`);
    }

    return parts.join(":");
}
