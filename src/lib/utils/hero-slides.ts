// src/lib/utils/hero-slides.ts
import { SelectHeroSlide } from "@/lib/db/schema/hero-slides";
import { db } from "@/lib/db";
import { products, collections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generate link URL from slide data (optimized - no DB queries)
 */
export function getHeroSlideLink(slide: HeroSlideWithLinks): string | null {
    switch (slide.linkType) {
        case 'product':
            if (!slide.linkedProduct) return null;
            const productSlug = slide.linkedProduct.sku ?? 
                slide.linkedProduct.name.toLowerCase().replace(/\s+/g, '-');
            return `/products/${productSlug}`;
            
        case 'collection':
            if (!slide.linkedCollection) return null;
            return `/collections/${slide.linkedCollection.slug}`;
            
        case 'external':
            return slide.externalUrl || null;
            
        case 'none':
        default:
            return null;
    }
}

/**
 * Validates if an image/video file meets hero slide requirements
 */
export function validateHeroMedia(
    file: File,
    type: "desktop" | "mobile"
): { valid: boolean; error?: string } {
    const maxImageSize = 8 * 1024 * 1024; // 8MB
    const maxVideoSize = 32 * 1024 * 1024; // 32MB

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
        return { valid: false, error: "File must be an image or video" };
    }

    const maxSize = isVideo ? maxVideoSize : maxImageSize;
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
        };
    }

    // Check aspect ratio recommendations (optional)
    // This would require reading the file dimensions

    return { valid: true };
}

/**
 * Gets the complete URL for a hero slide link with proper slug resolution
 */
export async function resolveHeroSlideLink(
    slide: SelectHeroSlide
): Promise<string | null> {
    try {
        switch (slide.linkType) {
            case "product": {
                if (!slide.linkedProductId) return null;

                const [product] = await db
                    .select({
                        slug: products.sku, // Assuming you want to use SKU as slug
                        name: products.name
                    })
                    .from(products)
                    .where(eq(products.id, slide.linkedProductId))
                    .limit(1);

                if (!product) {
                    console.warn(`Linked product ${slide.linkedProductId} not found`);
                    return null;
                }

                // Create slug from name if no SKU
                const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");
                return `/products/${slug}`;
            }

            case "collection": {
                if (!slide.linkedCollectionId) return null;

                const [collection] = await db
                    .select({ slug: collections.slug })
                    .from(collections)
                    .where(eq(collections.id, slide.linkedCollectionId))
                    .limit(1);

                if (!collection) {
                    console.warn(`Linked collection ${slide.linkedCollectionId} not found`);
                    return null;
                }

                return `/collections/${collection.slug}`;
            }

            case "external":
                return slide.externalUrl || null;

            case "none":
            default:
                return null;
        }
    } catch (error) {
        console.error("Error resolving hero slide link:", error);
        return null;
    }
}

/**
 * Batch resolve links for multiple slides (optimized)
 */
export async function batchResolveHeroSlideLinks(
    slides: SelectHeroSlide[]
): Promise<Map<string, string | null>> {
    const linkMap = new Map<string, string | null>();

    // Separate slides by link type for batch queries
    const productSlides = slides.filter((s) => s.linkType === "product" && s.linkedProductId);
    const collectionSlides = slides.filter((s) => s.linkType === "collection" && s.linkedCollectionId);

    // Batch fetch products
    if (productSlides.length > 0) {
        const productIds = productSlides.map((s) => s.linkedProductId!);
        const productData = await db
            .select({ id: products.id, slug: products.sku, name: products.name })
            .from(products)
            .where(inArray(products.id, productIds));

        const productMap = new Map(
            productData.map((p) => [
                p.id,
                `/products/${p.slug || p.name.toLowerCase().replace(/\s+/g, "-")}`,
            ])
        );

        productSlides.forEach((slide) => {
            linkMap.set(slide.id, productMap.get(slide.linkedProductId!) || null);
        });
    }

    // Batch fetch collections
    if (collectionSlides.length > 0) {
        const collectionIds = collectionSlides.map((s) => s.linkedCollectionId!);
        const collectionData = await db
            .select({ id: collections.id, slug: collections.slug })
            .from(collections)
            .where(inArray(collections.id, collectionIds));

        const collectionMap = new Map(
            collectionData.map((c) => [c.id, `/collections/${c.slug}`])
        );

        collectionSlides.forEach((slide) => {
            linkMap.set(slide.id, collectionMap.get(slide.linkedCollectionId!) || null);
        });
    }

    // Handle external and none types
    slides.forEach((slide) => {
        if (!linkMap.has(slide.id)) {
            if (slide.linkType === "external") {
                linkMap.set(slide.id, slide.externalUrl || null);
            } else {
                linkMap.set(slide.id, null);
            }
        }
    });

    return linkMap;
}

/**
 * Check if a slide is currently active based on scheduling
 */
export function isSlideActive(slide: SelectHeroSlide): boolean {
    if (!slide.isPublished) return false;

    const now = new Date();

    // Check if published date has passed
    if (slide.publishedAt && slide.publishedAt > now) {
        return false;
    }

    // Check if expiration date has not been reached
    if (slide.expiresAt && slide.expiresAt < now) {
        return false;
    }

    return true;
}

/**
 * Generate a preview URL for a slide (for admin previews)
 */
export function getSlidePreviewUrl(slide: SelectHeroSlide): string {
    return `/api/hero-slides/preview/${slide.id}`;
}

/**
 * Calculate the optimal aspect ratio for uploaded media
 */
export function calculateAspectRatio(
    width: number,
    height: number
): { ratio: string; matches: "desktop" | "mobile" | "custom" } {
    const aspectRatio = width / height;

    // Desktop recommendation: 16:6 (2.667)
    const desktopRatio = 16 / 6;
    if (Math.abs(aspectRatio - desktopRatio) < 0.1) {
        return { ratio: "16:6", matches: "desktop" };
    }

    // Mobile recommendation: 3:4 (0.75)
    const mobileRatio = 3 / 4;
    if (Math.abs(aspectRatio - mobileRatio) < 0.1) {
        return { ratio: "3:4", matches: "mobile" };
    }

    // Custom ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return {
        ratio: `${width / divisor}:${height / divisor}`,
        matches: "custom",
    };
}

/**
 * Format slide data for analytics tracking
 */
export function formatSlideForAnalytics(slide: SelectHeroSlide) {
    return {
        slide_id: slide.id,
        slide_title: slide.title || "Untitled",
        link_type: slide.linkType,
        media_type_desktop: slide.desktopMediaType,
        media_type_mobile: slide.mobileMediaType,
        is_published: slide.isPublished,
        sort_order: slide.sortOrder,
    };
}

/**
 * Get slide statistics for admin dashboard
 */
export async function getHeroSlideStats() {
    const [stats] = await db
        .select({
            total: count(),
            published: sum(sql<number>`case when ${heroSlides.isPublished} then 1 else 0 end`),
            withLinks: sum(
                sql<number>`case when ${heroSlides.linkType} != 'none' then 1 else 0 end`
            ),
        })
        .from(heroSlides);

    return {
        total: Number(stats?.total || 0),
        published: Number(stats?.published || 0),
        draft: Number(stats?.total || 0) - Number(stats?.published || 0),
        withLinks: Number(stats?.withLinks || 0),
    };
}

/**
 * Sanitize external URLs for security
 */
export function sanitizeExternalUrl(url: string): string | null {
    try {
        const parsed = new URL(url);

        // Only allow http and https protocols
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return null;
        }

        return parsed.toString();
    } catch {
        return null;
    }
}

/**
 * Generate a cache key for hero slides
 */
export function getHeroSlidesCacheKey(
    filters: {
        published?: boolean;
        linkType?: string;
    } = {}
): string {
    const parts = ["hero-slides"];

    if (filters.published !== undefined) {
        parts.push(`published-${filters.published}`);
    }

    if (filters.linkType) {
        parts.push(`type-${filters.linkType}`);
    }

    return parts.join(":");
}

/**
 * Validate slide scheduling dates
 */
export function validateSlideScheduling(
    publishedAt?: Date | null,
    expiresAt?: Date | null
): { valid: boolean; error?: string } {
    if (!publishedAt && !expiresAt) {
        return { valid: true };
    }

    if (publishedAt && expiresAt && publishedAt >= expiresAt) {
        return {
            valid: false,
            error: "Expiration date must be after published date",
        };
    }

    const now = new Date();
    if (expiresAt && expiresAt < now) {
        return {
            valid: false,
            error: "Expiration date must be in the future",
        };
    }

    return { valid: true };
}

// Missing import for inArray
import { inArray, count, sum, sql } from "drizzle-orm";
import { heroSlides } from "@/lib/db/schema/hero-slides";
import { HeroSlideWithLinks } from "../actions/hero-slides";
