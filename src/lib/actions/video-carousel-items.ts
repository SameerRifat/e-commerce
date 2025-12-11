// src/lib/actions/video-carousel-items.ts
"use server";

import { db } from "@/lib/db";
import {
    videoCarouselItems,
    type InsertVideoCarouselItem,
    type SelectVideoCarouselItem,
    insertVideoCarouselItemSchema
} from "@/lib/db/schema/video-carousel-items";
import { products } from "@/lib/db/schema/products";
import { productImages } from "@/lib/db/schema/images";
import { productVariants } from "@/lib/db/schema/variants";
import { eq, asc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteUploadThingFiles, isUploadThingUrl } from "@/lib/uploadthing-utils";

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

// Extended type with auto-fetched product data
export type VideoCarouselItemWithProduct = SelectVideoCarouselItem & {
    product: {
        id: string;
        name: string;
        slug: string;
        price: string | null;
        primaryImageUrl: string | null;
    };
};

// ============================================
// GET: Fetch active video carousel items for frontend
// WITH product data fetched via INNER JOIN
// Handles both simple and configurable products
// ============================================
export async function getActiveVideoCarouselItems(): Promise<VideoCarouselItemWithProduct[]> {
    try {
        // Single query with INNER JOIN to fetch product data
        // For configurable products: gets lowest-priced variant (doesn't rely on default_variant_id)
        const items = await db
            .select({
                // Video carousel item fields
                id: videoCarouselItems.id,
                sortOrder: videoCarouselItems.sortOrder,
                isPublished: videoCarouselItems.isPublished,
                videoUrl: videoCarouselItems.videoUrl,
                linkedProductId: videoCarouselItems.linkedProductId,
                createdAt: videoCarouselItems.createdAt,
                updatedAt: videoCarouselItems.updatedAt,

                // Product data (auto-fetched from products table)
                productId: products.id,
                productName: products.name,
                productSlug: products.slug,
                productType: products.productType,

                // Price: Use product price (simple) OR lowest variant price (configurable)
                // Subquery to get cheapest variant price for configurable products
                productPrice: sql<string>`
                    COALESCE(
                        ${products.price},
                        (SELECT price FROM product_variants WHERE product_id = ${products.id} ORDER BY price ASC LIMIT 1)
                    )
                `.as('productPrice'),

                // Primary image from product_images
                primaryImageUrl: productImages.url,
            })
            .from(videoCarouselItems)
            .innerJoin(products, eq(videoCarouselItems.linkedProductId, products.id))
            .leftJoin(
                productImages,
                and(
                    eq(productImages.productId, products.id),
                    eq(productImages.isPrimary, true)
                )
            )
            .where(eq(videoCarouselItems.isPublished, true))
            .orderBy(asc(videoCarouselItems.sortOrder), asc(videoCarouselItems.createdAt));

        // Transform to expected type
        return items.map(item => ({
            id: item.id,
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
            videoUrl: item.videoUrl,
            linkedProductId: item.linkedProductId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: {
                id: item.productId,
                name: item.productName,
                slug: item.productSlug,
                price: item.productPrice,
                primaryImageUrl: item.primaryImageUrl,
            },
        }));
    } catch (error) {
        console.error("Error fetching active video carousel items:", error);
        return [];
    }
}

// ============================================
// GET: Fetch all video carousel items for admin (including unpublished)
// WITH product data fetched via INNER JOIN
// Handles both simple and configurable products
// ============================================
export async function getAllVideoCarouselItems(): Promise<VideoCarouselItemWithProduct[]> {
    try {
        const items = await db
            .select({
                // Video carousel item fields
                id: videoCarouselItems.id,
                sortOrder: videoCarouselItems.sortOrder,
                isPublished: videoCarouselItems.isPublished,
                videoUrl: videoCarouselItems.videoUrl,
                linkedProductId: videoCarouselItems.linkedProductId,
                createdAt: videoCarouselItems.createdAt,
                updatedAt: videoCarouselItems.updatedAt,

                // Product data (auto-fetched)
                productId: products.id,
                productName: products.name,
                productSlug: products.slug,
                productType: products.productType,

                // Price: Use product price (simple) OR lowest variant price (configurable)
                productPrice: sql<string>`
                    COALESCE(
                        ${products.price},
                        (SELECT price FROM product_variants WHERE product_id = ${products.id} ORDER BY price ASC LIMIT 1)
                    )
                `.as('productPrice'),

                // Primary image
                primaryImageUrl: productImages.url,
            })
            .from(videoCarouselItems)
            .innerJoin(products, eq(videoCarouselItems.linkedProductId, products.id))
            .leftJoin(
                productImages,
                and(
                    eq(productImages.productId, products.id),
                    eq(productImages.isPrimary, true)
                )
            )
            .orderBy(asc(videoCarouselItems.sortOrder), asc(videoCarouselItems.createdAt));

        // Transform to expected type
        return items.map(item => ({
            id: item.id,
            sortOrder: item.sortOrder,
            isPublished: item.isPublished,
            videoUrl: item.videoUrl,
            linkedProductId: item.linkedProductId,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            product: {
                id: item.productId,
                name: item.productName,
                slug: item.productSlug,
                price: item.productPrice,
                primaryImageUrl: item.primaryImageUrl,
            },
        }));
    } catch (error) {
        console.error("Error fetching all video carousel items:", error);
        return [];
    }
}

// ============================================
// GET: Fetch single video carousel item by ID
// Handles both simple and configurable products
// ============================================
export async function getVideoCarouselItemById(id: string): Promise<ActionResult<VideoCarouselItemWithProduct>> {
    try {
        const items = await db
            .select({
                // Video carousel item fields
                id: videoCarouselItems.id,
                sortOrder: videoCarouselItems.sortOrder,
                isPublished: videoCarouselItems.isPublished,
                videoUrl: videoCarouselItems.videoUrl,
                linkedProductId: videoCarouselItems.linkedProductId,
                createdAt: videoCarouselItems.createdAt,
                updatedAt: videoCarouselItems.updatedAt,

                // Product data
                productId: products.id,
                productName: products.name,
                productSlug: products.slug,
                productType: products.productType,

                // Price: Use product price (simple) OR lowest variant price (configurable)
                productPrice: sql<string>`
                    COALESCE(
                        ${products.price},
                        (SELECT price FROM product_variants WHERE product_id = ${products.id} ORDER BY price ASC LIMIT 1)
                    )
                `.as('productPrice'),

                // Primary image
                primaryImageUrl: productImages.url,
            })
            .from(videoCarouselItems)
            .innerJoin(products, eq(videoCarouselItems.linkedProductId, products.id))
            .leftJoin(
                productImages,
                and(
                    eq(productImages.productId, products.id),
                    eq(productImages.isPrimary, true)
                )
            )
            .where(eq(videoCarouselItems.id, id))
            .limit(1);

        if (!items || items.length === 0) {
            return {
                success: false,
                error: "Video carousel item not found",
            };
        }

        const item = items[0];

        return {
            success: true,
            data: {
                id: item.id,
                sortOrder: item.sortOrder,
                isPublished: item.isPublished,
                videoUrl: item.videoUrl,
                linkedProductId: item.linkedProductId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                product: {
                    id: item.productId,
                    name: item.productName,
                    slug: item.productSlug,
                    price: item.productPrice,
                    primaryImageUrl: item.primaryImageUrl,
                },
            },
        };
    } catch (error) {
        console.error("Error fetching video carousel item:", error);
        return {
            success: false,
            error: "Failed to fetch video carousel item",
        };
    }
}

// ============================================
// CREATE: Add new video carousel item
// ============================================
export async function createVideoCarouselItem(
    data: InsertVideoCarouselItem
): Promise<ActionResult<{ itemId: string }>> {
    try {
        // Validate input
        const validation = insertVideoCarouselItemSchema.safeParse(data);
        if (!validation.success) {
            const fieldErrors: Record<string, string[]> = {};
            validation.error.issues.forEach((issue) => {
                const path = issue.path.join('.');
                if (!fieldErrors[path]) {
                    fieldErrors[path] = [];
                }
                fieldErrors[path].push(issue.message);
            });

            return {
                success: false,
                error: "Validation failed",
                fieldErrors,
            };
        }

        // Validate linked product exists
        const [product] = await db
            .select({ id: products.id })
            .from(products)
            .where(eq(products.id, data.linkedProductId))
            .limit(1);

        if (!product) {
            return {
                success: false,
                error: "Linked product does not exist",
                fieldErrors: { linkedProductId: ["Product not found"] },
            };
        }

        // Get next sort order
        const [lastItem] = await db
            .select({ sortOrder: videoCarouselItems.sortOrder })
            .from(videoCarouselItems)
            .orderBy(asc(videoCarouselItems.sortOrder))
            .limit(1);

        const nextSortOrder = (lastItem?.sortOrder ?? -1) + 1;

        // Create item
        const [createdItem] = await db
            .insert(videoCarouselItems)
            .values({
                videoUrl: data.videoUrl,
                linkedProductId: data.linkedProductId,
                sortOrder: data.sortOrder ?? nextSortOrder,
                isPublished: data.isPublished,
                updatedAt: new Date(),
            })
            .returning({ id: videoCarouselItems.id });

        revalidatePath('/');
        revalidatePath('/dashboard/video-carousel');

        return {
            success: true,
            data: { itemId: createdItem.id },
        };
    } catch (error) {
        console.error("Error creating video carousel item:", error);
        return {
            success: false,
            error: "Failed to create video carousel item",
        };
    }
}

// ============================================
// UPDATE: Edit existing video carousel item
// ============================================
export async function updateVideoCarouselItem(
    id: string,
    data: Partial<InsertVideoCarouselItem>
): Promise<ActionResult<{ itemId: string }>> {
    try {
        // Check if item exists
        const [existingItem] = await db
            .select()
            .from(videoCarouselItems)
            .where(eq(videoCarouselItems.id, id))
            .limit(1);

        if (!existingItem) {
            return {
                success: false,
                error: "Video carousel item not found",
            };
        }

        // Validate linked product if being updated
        if (data.linkedProductId) {
            const [product] = await db
                .select({ id: products.id })
                .from(products)
                .where(eq(products.id, data.linkedProductId))
                .limit(1);

            if (!product) {
                return {
                    success: false,
                    error: "Linked product does not exist",
                    fieldErrors: { linkedProductId: ["Product not found"] },
                };
            }
        }

        // Track video files to delete
        const mediaToDelete: string[] = [];

        // Check if video is being replaced
        if (data.videoUrl !== undefined && existingItem.videoUrl && existingItem.videoUrl !== data.videoUrl) {
            if (isUploadThingUrl(existingItem.videoUrl)) {
                mediaToDelete.push(existingItem.videoUrl);
            }
        }

        // Update item
        await db
            .update(videoCarouselItems)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(videoCarouselItems.id, id));

        // Clean up old media from UploadThing after successful update
        if (mediaToDelete.length > 0) {
            deleteUploadThingFiles(mediaToDelete).catch(error => {
                console.error('[CLEANUP] Failed to delete old video carousel media:', error);
            });
            console.log(`[CLEANUP] Scheduled deletion of ${mediaToDelete.length} old video carousel media files`);
        }

        revalidatePath('/');
        revalidatePath('/dashboard/video-carousel');

        return {
            success: true,
            data: { itemId: id },
        };
    } catch (error) {
        console.error("Error updating video carousel item:", error);
        return {
            success: false,
            error: "Failed to update video carousel item",
        };
    }
}

// ============================================
// DELETE: Remove video carousel item
// ============================================
export async function deleteVideoCarouselItem(id: string): Promise<ActionResult> {
    try {
        // Get item data before deletion for cleanup
        const [item] = await db
            .select({
                videoUrl: videoCarouselItems.videoUrl,
            })
            .from(videoCarouselItems)
            .where(eq(videoCarouselItems.id, id))
            .limit(1);

        if (!item) {
            return {
                success: false,
                error: "Video carousel item not found",
            };
        }

        const [deletedItem] = await db
            .delete(videoCarouselItems)
            .where(eq(videoCarouselItems.id, id))
            .returning({ id: videoCarouselItems.id });

        if (!deletedItem) {
            return {
                success: false,
                error: "Video carousel item not found",
            };
        }

        // Clean up video from UploadThing after successful deletion
        const mediaToDelete: string[] = [];
        if (item.videoUrl && isUploadThingUrl(item.videoUrl)) {
            mediaToDelete.push(item.videoUrl);
        }

        if (mediaToDelete.length > 0) {
            deleteUploadThingFiles(mediaToDelete).catch(error => {
                console.error('[CLEANUP] Failed to delete video carousel media:', error);
            });
            console.log(`[CLEANUP] Scheduled deletion of ${mediaToDelete.length} video carousel media files`);
        }

        revalidatePath('/');
        revalidatePath('/dashboard/video-carousel');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting video carousel item:", error);
        return {
            success: false,
            error: "Failed to delete video carousel item",
        };
    }
}

// ============================================
// REORDER: Update item positions
// ============================================
export async function reorderVideoCarouselItems(
    itemOrders: Array<{ id: string; sortOrder: number }>
): Promise<ActionResult> {
    try {
        await db.transaction(async (tx) => {
            for (const { id, sortOrder } of itemOrders) {
                await tx
                    .update(videoCarouselItems)
                    .set({ sortOrder, updatedAt: new Date() })
                    .where(eq(videoCarouselItems.id, id));
            }
        });

        revalidatePath('/');
        revalidatePath('/dashboard/video-carousel');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error reordering video carousel items:", error);
        return {
            success: false,
            error: "Failed to reorder video carousel items",
        };
    }
}

// ============================================
// TOGGLE: Publish/unpublish item
// ============================================
export async function toggleVideoCarouselItemPublish(
    id: string,
    isPublished: boolean
): Promise<ActionResult> {
    try {
        await db
            .update(videoCarouselItems)
            .set({
                isPublished,
                updatedAt: new Date(),
            })
            .where(eq(videoCarouselItems.id, id));

        revalidatePath('/');
        revalidatePath('/dashboard/video-carousel');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error toggling video carousel item publish status:", error);
        return {
            success: false,
            error: "Failed to toggle publish status",
        };
    }
}
