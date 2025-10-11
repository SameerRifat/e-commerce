// src/lib/actions/hero-slides.ts
"use server";

import { db } from "@/lib/db";
import {
    heroSlides,
    type InsertHeroSlide,
    type SelectHeroSlide,
    insertHeroSlideSchema
} from "@/lib/db/schema/hero-slides";
import { products } from "@/lib/db/schema/products";
import { collections } from "@/lib/db/schema/collections";
import { eq, asc, and, or, lte, gte, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

// Extended type with resolved links
export type HeroSlideWithLinks = SelectHeroSlide & {
    linkedProduct?: {
        id: string;
        name: string;
        sku: string | null;
    } | null;
    linkedCollection?: {
        id: string;
        name: string;
        slug: string;
    } | null;
};

// ============================================
// GET: Fetch active hero slides for frontend
// WITH linked product/collection data in ONE query
// ============================================
export async function getActiveHeroSlides(): Promise<HeroSlideWithLinks[]> {
    try {
        const now = new Date();

        // Single query with LEFT JOINs to fetch everything at once
        const slides = await db
            .select({
                // Hero slide fields
                id: heroSlides.id,
                title: heroSlides.title,
                sortOrder: heroSlides.sortOrder,
                isPublished: heroSlides.isPublished,
                desktopMediaType: heroSlides.desktopMediaType,
                desktopMediaUrl: heroSlides.desktopMediaUrl,
                mobileMediaType: heroSlides.mobileMediaType,
                mobileMediaUrl: heroSlides.mobileMediaUrl,
                linkType: heroSlides.linkType,
                linkedProductId: heroSlides.linkedProductId,
                linkedCollectionId: heroSlides.linkedCollectionId,
                externalUrl: heroSlides.externalUrl,
                altText: heroSlides.altText,
                description: heroSlides.description,
                publishedAt: heroSlides.publishedAt,
                expiresAt: heroSlides.expiresAt,
                createdAt: heroSlides.createdAt,
                updatedAt: heroSlides.updatedAt,
                
                // Linked product data (will be null if not linked)
                linkedProduct: {
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                },
                
                // Linked collection data (will be null if not linked)
                linkedCollection: {
                    id: collections.id,
                    name: collections.name,
                    slug: collections.slug,
                },
            })
            .from(heroSlides)
            .leftJoin(products, eq(heroSlides.linkedProductId, products.id))
            .leftJoin(collections, eq(heroSlides.linkedCollectionId, collections.id))
            .where(
                and(
                    eq(heroSlides.isPublished, true),
                    // Check scheduling constraints
                    or(
                        isNull(heroSlides.publishedAt),
                        lte(heroSlides.publishedAt, now)
                    ),
                    or(
                        isNull(heroSlides.expiresAt),
                        gte(heroSlides.expiresAt, now)
                    )
                )
            )
            .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt));

        return slides;
    } catch (error) {
        console.error("Error fetching active hero slides:", error);
        return [];
    }
}

// ============================================
// GET: Fetch all hero slides for admin (including unpublished)
// WITH linked product/collection data in ONE query
// ============================================
export async function getAllHeroSlides(): Promise<HeroSlideWithLinks[]> {
    try {
        const slides = await db
            .select({
                // Hero slide fields
                id: heroSlides.id,
                title: heroSlides.title,
                sortOrder: heroSlides.sortOrder,
                isPublished: heroSlides.isPublished,
                desktopMediaType: heroSlides.desktopMediaType,
                desktopMediaUrl: heroSlides.desktopMediaUrl,
                mobileMediaType: heroSlides.mobileMediaType,
                mobileMediaUrl: heroSlides.mobileMediaUrl,
                linkType: heroSlides.linkType,
                linkedProductId: heroSlides.linkedProductId,
                linkedCollectionId: heroSlides.linkedCollectionId,
                externalUrl: heroSlides.externalUrl,
                altText: heroSlides.altText,
                description: heroSlides.description,
                publishedAt: heroSlides.publishedAt,
                expiresAt: heroSlides.expiresAt,
                createdAt: heroSlides.createdAt,
                updatedAt: heroSlides.updatedAt,
                
                // Linked product data
                linkedProduct: {
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                },
                
                // Linked collection data
                linkedCollection: {
                    id: collections.id,
                    name: collections.name,
                    slug: collections.slug,
                },
            })
            .from(heroSlides)
            .leftJoin(products, eq(heroSlides.linkedProductId, products.id))
            .leftJoin(collections, eq(heroSlides.linkedCollectionId, collections.id))
            .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.createdAt));

        return slides;
    } catch (error) {
        console.error("Error fetching all hero slides:", error);
        return [];
    }
}

// ============================================
// GET: Fetch single hero slide by ID
// ============================================
export async function getHeroSlideById(id: string): Promise<ActionResult<HeroSlideWithLinks>> {
    try {
        const [slide] = await db
            .select({
                // Hero slide fields
                id: heroSlides.id,
                title: heroSlides.title,
                sortOrder: heroSlides.sortOrder,
                isPublished: heroSlides.isPublished,
                desktopMediaType: heroSlides.desktopMediaType,
                desktopMediaUrl: heroSlides.desktopMediaUrl,
                mobileMediaType: heroSlides.mobileMediaType,
                mobileMediaUrl: heroSlides.mobileMediaUrl,
                linkType: heroSlides.linkType,
                linkedProductId: heroSlides.linkedProductId,
                linkedCollectionId: heroSlides.linkedCollectionId,
                externalUrl: heroSlides.externalUrl,
                altText: heroSlides.altText,
                description: heroSlides.description,
                publishedAt: heroSlides.publishedAt,
                expiresAt: heroSlides.expiresAt,
                createdAt: heroSlides.createdAt,
                updatedAt: heroSlides.updatedAt,
                
                // Linked product data
                linkedProduct: {
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                },
                
                // Linked collection data
                linkedCollection: {
                    id: collections.id,
                    name: collections.name,
                    slug: collections.slug,
                },
            })
            .from(heroSlides)
            .leftJoin(products, eq(heroSlides.linkedProductId, products.id))
            .leftJoin(collections, eq(heroSlides.linkedCollectionId, collections.id))
            .where(eq(heroSlides.id, id))
            .limit(1);

        if (!slide) {
            return {
                success: false,
                error: "Hero slide not found",
            };
        }

        return {
            success: true,
            data: slide,
        };
    } catch (error) {
        console.error("Error fetching hero slide:", error);
        return {
            success: false,
            error: "Failed to fetch hero slide",
        };
    }
}



// ============================================
// CREATE: Add new hero slide
// ============================================
export async function createHeroSlide(
    data: InsertHeroSlide
): Promise<ActionResult<{ slideId: string }>> {
    try {
        // Validate input
        const validation = insertHeroSlideSchema.safeParse(data);
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

        // Validate linked entities exist
        if (data.linkType === 'product' && data.linkedProductId) {
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

        if (data.linkType === 'collection' && data.linkedCollectionId) {
            const [collection] = await db
                .select({ id: collections.id })
                .from(collections)
                .where(eq(collections.id, data.linkedCollectionId))
                .limit(1);

            if (!collection) {
                return {
                    success: false,
                    error: "Linked collection does not exist",
                    fieldErrors: { linkedCollectionId: ["Collection not found"] },
                };
            }
        }

        // Get next sort order
        const [lastSlide] = await db
            .select({ sortOrder: heroSlides.sortOrder })
            .from(heroSlides)
            .orderBy(asc(heroSlides.sortOrder))
            .limit(1);

        const nextSortOrder = (lastSlide?.sortOrder ?? -1) + 1;

        // Create slide
        const [createdSlide] = await db
            .insert(heroSlides)
            .values({
                ...data,
                sortOrder: data.sortOrder ?? nextSortOrder,
                updatedAt: new Date(),
            })
            .returning({ id: heroSlides.id });

        revalidatePath('/');
        revalidatePath('/dashboard/hero-slides');

        return {
            success: true,
            data: { slideId: createdSlide.id },
        };
    } catch (error) {
        console.error("Error creating hero slide:", error);
        return {
            success: false,
            error: "Failed to create hero slide",
        };
    }
}

// ============================================
// UPDATE: Edit existing hero slide
// ============================================
export async function updateHeroSlide(
    id: string,
    data: Partial<InsertHeroSlide>
): Promise<ActionResult<{ slideId: string }>> {
    try {
        // Check if slide exists
        const [existingSlide] = await db
            .select()
            .from(heroSlides)
            .where(eq(heroSlides.id, id))
            .limit(1);

        if (!existingSlide) {
            return {
                success: false,
                error: "Hero slide not found",
            };
        }

        // Validate linked entities if being updated
        if (data.linkType === 'product' && data.linkedProductId) {
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

        if (data.linkType === 'collection' && data.linkedCollectionId) {
            const [collection] = await db
                .select({ id: collections.id })
                .from(collections)
                .where(eq(collections.id, data.linkedCollectionId))
                .limit(1);

            if (!collection) {
                return {
                    success: false,
                    error: "Linked collection does not exist",
                    fieldErrors: { linkedCollectionId: ["Collection not found"] },
                };
            }
        }

        // Update slide
        await db
            .update(heroSlides)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(heroSlides.id, id));

        revalidatePath('/');
        revalidatePath('/dashboard/hero-slides');

        return {
            success: true,
            data: { slideId: id },
        };
    } catch (error) {
        console.error("Error updating hero slide:", error);
        return {
            success: false,
            error: "Failed to update hero slide",
        };
    }
}

// ============================================
// DELETE: Remove hero slide
// ============================================
export async function deleteHeroSlide(id: string): Promise<ActionResult> {
    try {
        const [deletedSlide] = await db
            .delete(heroSlides)
            .where(eq(heroSlides.id, id))
            .returning({ id: heroSlides.id });

        if (!deletedSlide) {
            return {
                success: false,
                error: "Hero slide not found",
            };
        }

        revalidatePath('/');
        revalidatePath('/dashboard/hero-slides');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting hero slide:", error);
        return {
            success: false,
            error: "Failed to delete hero slide",
        };
    }
}

// ============================================
// REORDER: Update slide positions
// ============================================
export async function reorderHeroSlides(
    slideOrders: Array<{ id: string; sortOrder: number }>
): Promise<ActionResult> {
    try {
        await db.transaction(async (tx) => {
            for (const { id, sortOrder } of slideOrders) {
                await tx
                    .update(heroSlides)
                    .set({ sortOrder, updatedAt: new Date() })
                    .where(eq(heroSlides.id, id));
            }
        });

        revalidatePath('/');
        revalidatePath('/dashboard/hero-slides');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error reordering hero slides:", error);
        return {
            success: false,
            error: "Failed to reorder hero slides",
        };
    }
}

// ============================================
// TOGGLE: Publish/unpublish slide
// ============================================
export async function toggleHeroSlidePublish(
    id: string,
    isPublished: boolean
): Promise<ActionResult> {
    try {
        await db
            .update(heroSlides)
            .set({
                isPublished,
                updatedAt: new Date(),
                publishedAt: isPublished && !isPublished ? new Date() : undefined,
            })
            .where(eq(heroSlides.id, id));

        revalidatePath('/');
        revalidatePath('/dashboard/hero-slides');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error toggling hero slide publish status:", error);
        return {
            success: false,
            error: "Failed to toggle publish status",
        };
    }
}