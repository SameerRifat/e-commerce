// src/lib/actions/collections.ts
"use server";

import { db } from "@/lib/db";
import {
    collections,
    productCollections,
    type InsertCollection,
    type SelectCollection,
    insertCollectionSchema
} from "@/lib/db/schema/collections";
import { products, productImages, productVariants, reviews } from "@/lib/db/schema";
import { eq, asc, and, desc, sql, inArray, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteUploadThingFiles, isUploadThingUrl } from "@/lib/uploadthing-utils";

export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

// Product data structure matching ProductCard expectations
export type CollectionProduct = {
    id: string;
    slug: string;
    name: string;
    imageUrl: string | null;
    hoverImageUrl: string | null;
    price: number | null;
    salePrice: number | null;
    discountPercentage: number | null;
    createdAt: Date;
    averageRating: number | null;
    reviewCount: number;
    productType: string;
};

export type CollectionData = {
    collection: SelectCollection;
    products: CollectionProduct[];
    totalCount: number;
    hasMore: boolean;
};

type SortOption = "featured" | "price_asc" | "price_desc" | "newest";

// ============================================
// GET: Collection products with pagination
// Industry Pattern: Database-level pagination (Shopify, WooCommerce, Magento)
// FIXED: No more in-memory sorting - proper SQL pagination
// ============================================
export async function getCollectionProducts(
    slug: string,
    page: number = 1,
    limit: number = 24,
    sort: SortOption = "featured"
): Promise<CollectionData | null> {
    try {
        // 1. Get collection (simplified - no scheduling checks)
        const [collection] = await db
            .select()
            .from(collections)
            .where(
                and(
                    eq(collections.slug, slug),
                    eq(collections.isPublished, true)
                )
            )
            .limit(1);

        if (!collection) return null;

        // 2. Get paginated product IDs from junction table
        // FIXED: Paginate at database level, not in memory
        const offset = (page - 1) * limit;

        // For "featured" sort, use manual sortOrder from junction table
        const productIdsQuery = sort === "featured"
            ? await db
                .select({ productId: productCollections.productId })
                .from(productCollections)
                .where(eq(productCollections.collectionId, collection.id))
                .orderBy(asc(productCollections.sortOrder), desc(productCollections.addedAt))
            : await db
                .select({ productId: productCollections.productId })
                .from(productCollections)
                .where(eq(productCollections.collectionId, collection.id))
                .orderBy(desc(productCollections.addedAt));

        const allProductIds = productIdsQuery.map(p => p.productId);
        const totalCount = allProductIds.length;

        if (totalCount === 0) {
            return {
                collection,
                products: [],
                totalCount: 0,
                hasMore: false,
            };
        }

        // Paginate product IDs
        const paginatedProductIds = allProductIds.slice(offset, offset + limit);

        // 3. Build product query with all necessary data
        // This is complex but necessary for e-commerce (pricing, images, reviews)

        // Images subquery - get first 2 images per product
        const imagesJoin = db
            .select({
                productId: productImages.productId,
                url: productImages.url,
                rn: sql<number>`row_number() over (
                    partition by ${productImages.productId}
                    order by
                        case when ${productImages.variantId} is null then 0 else 1 end asc,
                        ${productImages.isPrimary} desc,
                        ${productImages.sortOrder} asc,
                        ${productImages.id} asc
                )`.as("rn"),
            })
            .from(productImages)
            .as("pi");

        // Reviews subquery - aggregate rating and count
        const reviewsJoin = db
            .select({
                productId: reviews.productId,
                avgRating: sql<number | null>`avg(${reviews.rating})`.as("avg_rating"),
                reviewCount: sql<number>`count(${reviews.id})::int`.as("review_count"),
            })
            .from(reviews)
            .groupBy(reviews.productId)
            .as("r");

        // Variants subquery - for configurable product pricing
        const variantJoin = db
            .select({
                productId: productVariants.productId,
                price: sql<number>`${productVariants.price}::numeric`.as("variant_price"),
                salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as("variant_sale_price"),
                effectivePrice: sql<number>`COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)`.as("effective_price"),
            })
            .from(productVariants)
            .as("v");

        // Price aggregations - handle both simple and configurable products
        const cheapestVariantPrice = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN ${products.price}::numeric
                ELSE (
                    ARRAY_AGG(
                        ${variantJoin.price}
                        ORDER BY ${variantJoin.effectivePrice} ASC
                    ) FILTER (WHERE ${variantJoin.price} IS NOT NULL)
                )[1]
            END
        `;

        const cheapestVariantSalePrice = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN ${products.salePrice}::numeric
                ELSE (
                    ARRAY_AGG(
                        ${variantJoin.salePrice}
                        ORDER BY ${variantJoin.effectivePrice} ASC
                    ) FILTER (WHERE ${variantJoin.price} IS NOT NULL)
                )[1]
            END
        `;

        const maxDiscountAgg = sql<number | null>`
            CASE
                WHEN ${products.productType} = 'simple' THEN
                    CASE
                        WHEN ${products.salePrice} IS NOT NULL AND ${products.price}::numeric > 0
                        THEN round((1 - ${products.salePrice}::numeric / ${products.price}::numeric) * 100)
                        ELSE NULL
                    END
                ELSE
                    max(
                        CASE
                            WHEN ${variantJoin.salePrice} IS NOT NULL AND ${variantJoin.price} > 0
                            THEN round((1 - ${variantJoin.salePrice} / ${variantJoin.price}) * 100)
                            ELSE NULL
                        END
                    )
            END
        `;

        const imageAgg = sql<string | null>`min(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;
        const hoverImageAgg = sql<string | null>`min(case when ${imagesJoin.rn} = 2 then ${imagesJoin.url} else null end)`;

        const effectivePriceAgg = sql`
            CASE
                WHEN ${products.productType} = 'simple' THEN
                    COALESCE(${products.salePrice}::numeric, ${products.price}::numeric)
                ELSE
                    min(${variantJoin.effectivePrice})
            END
        `;

        // 4. Determine sort order for product query
        let orderBy: SQL[];

        if (sort === "featured") {
            // For featured, we already sorted by junction table sortOrder
            // Just maintain order from paginatedProductIds
            orderBy = [asc(products.id) as SQL]; // Will be sorted by ID array order
        } else if (sort === "price_asc") {
            orderBy = [asc(effectivePriceAgg) as SQL, desc(products.createdAt) as SQL];
        } else if (sort === "price_desc") {
            orderBy = [desc(effectivePriceAgg) as SQL, desc(products.createdAt) as SQL];
        } else {
            // newest
            orderBy = [desc(products.createdAt) as SQL, asc(products.id) as SQL];
        }

        // 5. Query products (ONLY for paginated IDs)
        const productsResult = await db
            .select({
                id: products.id,
                slug: products.slug,
                name: products.name,
                createdAt: products.createdAt,
                productType: products.productType,
                price: cheapestVariantPrice,
                salePrice: cheapestVariantSalePrice,
                discountPercentage: maxDiscountAgg,
                imageUrl: imageAgg,
                hoverImageUrl: hoverImageAgg,
                averageRating: reviewsJoin.avgRating,
                reviewCount: sql<number>`coalesce(${reviewsJoin.reviewCount}, 0)`,
            })
            .from(products)
            .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
            .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
            .leftJoin(reviewsJoin, eq(reviewsJoin.productId, products.id))
            .where(
                and(
                    inArray(products.id, paginatedProductIds),
                    eq(products.isPublished, true)
                )
            )
            .groupBy(
                products.id,
                products.slug,
                products.name,
                products.createdAt,
                products.productType,
                products.price,
                products.salePrice,
                reviewsJoin.avgRating,
                reviewsJoin.reviewCount
            )
            .orderBy(...orderBy);

        // 6. For "featured" sort, maintain original order from junction table
        let finalProducts = productsResult;
        if (sort === "featured") {
            // Create order map from paginatedProductIds
            const orderMap = new Map(paginatedProductIds.map((id, index) => [id, index]));
            finalProducts = productsResult.sort((a, b) => {
                const orderA = orderMap.get(a.id) ?? 999;
                const orderB = orderMap.get(b.id) ?? 999;
                return orderA - orderB;
            });
        }

        // 7. Format results
        const formattedProducts: CollectionProduct[] = finalProducts.map((p) => ({
            id: p.id,
            slug: p.slug,
            name: p.name,
            imageUrl: p.imageUrl,
            hoverImageUrl: p.hoverImageUrl,
            price: p.price === null ? null : Number(p.price),
            salePrice: p.salePrice === null ? null : Number(p.salePrice),
            discountPercentage: p.discountPercentage === null ? null : Number(p.discountPercentage),
            createdAt: p.createdAt,
            averageRating: p.averageRating ? Number(p.averageRating) : null,
            reviewCount: Number(p.reviewCount),
            productType: p.productType,
        }));

        return {
            collection,
            products: formattedProducts,
            totalCount,
            hasMore: offset + limit < totalCount,
        };
    } catch (error) {
        console.error("Error fetching collection products:", error);
        return null;
    }
}

// ============================================
// GET: Collection by slug (lightweight, for metadata)
// ============================================
export async function getCollectionBySlug(slug: string) {
    try {
        const [collection] = await db
            .select()
            .from(collections)
            .where(
                and(
                    eq(collections.slug, slug),
                    eq(collections.isPublished, true)
                )
            )
            .limit(1);

        return collection || null;
    } catch (error) {
        console.error("Error fetching collection:", error);
        return null;
    }
}

// Extended type with product count
export type CollectionWithMeta = SelectCollection & {
    productCount: number;
};

// ============================================
// GET: Fetch active collections for frontend
// ============================================
export async function getActiveCollections(): Promise<CollectionWithMeta[]> {
    try {
        const collectionsData = await db
            .select({
                id: collections.id,
                name: collections.name,
                slug: collections.slug,
                description: collections.description,
                imageUrl: collections.imageUrl,
                thumbnailUrl: collections.thumbnailUrl,
                isPublished: collections.isPublished,
                isFeatured: collections.isFeatured,
                displayOrder: collections.displayOrder,
                metaTitle: collections.metaTitle,
                metaDescription: collections.metaDescription,
                createdAt: collections.createdAt,
                updatedAt: collections.updatedAt,
                productCount: sql<number>`count(distinct ${productCollections.productId})::int`,
            })
            .from(collections)
            .leftJoin(productCollections, eq(productCollections.collectionId, collections.id))
            .where(eq(collections.isPublished, true))
            .groupBy(collections.id)
            .orderBy(asc(collections.displayOrder), desc(collections.createdAt));

        return collectionsData;
    } catch (error) {
        console.error("Error fetching active collections:", error);
        return [];
    }
}

// ============================================
// GET: Fetch featured collections (for navbar)
// ============================================
export async function getFeaturedCollections(): Promise<SelectCollection[]> {
    try {
        const featured = await db
            .select()
            .from(collections)
            .where(
                and(
                    eq(collections.isPublished, true),
                    eq(collections.isFeatured, true)
                )
            )
            .orderBy(asc(collections.displayOrder))
            .limit(5); // Limit for navbar

        return featured;
    } catch (error) {
        console.error("Error fetching featured collections:", error);
        return [];
    }
}

// ============================================
// GET: All collections for admin
// ============================================
export async function getAllCollections(): Promise<CollectionWithMeta[]> {
    try {
        const collectionsData = await db
            .select({
                id: collections.id,
                name: collections.name,
                slug: collections.slug,
                description: collections.description,
                imageUrl: collections.imageUrl,
                thumbnailUrl: collections.thumbnailUrl,
                isPublished: collections.isPublished,
                isFeatured: collections.isFeatured,
                displayOrder: collections.displayOrder,
                metaTitle: collections.metaTitle,
                metaDescription: collections.metaDescription,
                createdAt: collections.createdAt,
                updatedAt: collections.updatedAt,
                productCount: sql<number>`count(distinct ${productCollections.productId})::int`,
            })
            .from(collections)
            .leftJoin(productCollections, eq(productCollections.collectionId, collections.id))
            .groupBy(collections.id)
            .orderBy(asc(collections.displayOrder), desc(collections.createdAt));

        return collectionsData;
    } catch (error) {
        console.error("Error fetching all collections:", error);
        return [];
    }
}

// ============================================
// GET: Single collection by ID (for admin)
// ============================================
export async function getCollectionById(id: string): Promise<ActionResult<SelectCollection>> {
    try {
        const [collection] = await db
            .select()
            .from(collections)
            .where(eq(collections.id, id))
            .limit(1);

        if (!collection) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        return {
            success: true,
            data: collection,
        };
    } catch (error) {
        console.error("Error fetching collection:", error);
        return {
            success: false,
            error: "Failed to fetch collection",
        };
    }
}

// ============================================
// CREATE: Add new collection
// ============================================
export async function createCollection(
    data: InsertCollection
): Promise<ActionResult<{ collectionId: string }>> {
    try {
        // Validate input
        const validation = insertCollectionSchema.safeParse(data);
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

        // Check slug uniqueness
        const [existing] = await db
            .select({ id: collections.id })
            .from(collections)
            .where(eq(collections.slug, data.slug))
            .limit(1);

        if (existing) {
            return {
                success: false,
                error: "Slug already exists",
                fieldErrors: { slug: ["This slug is already in use"] },
            };
        }

        // Get next display order
        const [lastCollection] = await db
            .select({ displayOrder: collections.displayOrder })
            .from(collections)
            .orderBy(desc(collections.displayOrder))
            .limit(1);

        const nextDisplayOrder = (lastCollection?.displayOrder ?? -1) + 1;

        // Create collection
        const [createdCollection] = await db
            .insert(collections)
            .values({
                ...data,
                displayOrder: data.displayOrder ?? nextDisplayOrder,
                updatedAt: new Date(),
            })
            .returning({ id: collections.id });

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
            data: { collectionId: createdCollection.id },
        };
    } catch (error) {
        console.error("Error creating collection:", error);
        return {
            success: false,
            error: "Failed to create collection",
        };
    }
}

// ============================================
// UPDATE: Edit collection
// ============================================
export async function updateCollection(
    id: string,
    data: Partial<InsertCollection>
): Promise<ActionResult<{ collectionId: string }>> {
    try {
        // Check if exists
        const [existing] = await db
            .select()
            .from(collections)
            .where(eq(collections.id, id))
            .limit(1);

        if (!existing) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        // Check slug uniqueness if slug is being updated
        if (data.slug && data.slug !== existing.slug) {
            const [slugExists] = await db
                .select({ id: collections.id })
                .from(collections)
                .where(eq(collections.slug, data.slug))
                .limit(1);

            if (slugExists) {
                return {
                    success: false,
                    error: "Slug already exists",
                    fieldErrors: { slug: ["This slug is already in use"] },
                };
            }
        }

        // Track images to delete
        const imagesToDelete: string[] = [];

        // Check if hero image is being replaced
        if (data.imageUrl !== undefined && existing.imageUrl && existing.imageUrl !== data.imageUrl) {
            if (isUploadThingUrl(existing.imageUrl)) {
                imagesToDelete.push(existing.imageUrl);
            }
        }

        // Check if thumbnail is being replaced
        if (data.thumbnailUrl !== undefined && existing.thumbnailUrl && existing.thumbnailUrl !== data.thumbnailUrl) {
            if (isUploadThingUrl(existing.thumbnailUrl)) {
                imagesToDelete.push(existing.thumbnailUrl);
            }
        }

        // Update
        await db
            .update(collections)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(collections.id, id));

        // Clean up old images from UploadThing after successful update
        if (imagesToDelete.length > 0) {
            deleteUploadThingFiles(imagesToDelete).catch(error => {
                console.error('[CLEANUP] Failed to delete old collection images:', error);
            });
            console.log(`[CLEANUP] Scheduled deletion of ${imagesToDelete.length} old collection images`);
        }

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
            data: { collectionId: id },
        };
    } catch (error) {
        console.error("Error updating collection:", error);
        return {
            success: false,
            error: "Failed to update collection",
        };
    }
}

// ============================================
// DELETE: Remove collection
// ============================================
export async function deleteCollection(id: string): Promise<ActionResult> {
    try {
        // Get collection data before deletion for cleanup
        const [collection] = await db
            .select({
                imageUrl: collections.imageUrl,
                thumbnailUrl: collections.thumbnailUrl,
            })
            .from(collections)
            .where(eq(collections.id, id))
            .limit(1);

        if (!collection) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        const [deletedCollection] = await db
            .delete(collections)
            .where(eq(collections.id, id))
            .returning({ id: collections.id });

        if (!deletedCollection) {
            return {
                success: false,
                error: "Collection not found",
            };
        }

        // Clean up images from UploadThing after successful deletion
        const imagesToDelete: string[] = [];
        if (collection.imageUrl && isUploadThingUrl(collection.imageUrl)) {
            imagesToDelete.push(collection.imageUrl);
        }
        if (collection.thumbnailUrl && isUploadThingUrl(collection.thumbnailUrl)) {
            imagesToDelete.push(collection.thumbnailUrl);
        }

        if (imagesToDelete.length > 0) {
            deleteUploadThingFiles(imagesToDelete).catch(error => {
                console.error('[CLEANUP] Failed to delete collection images:', error);
            });
            console.log(`[CLEANUP] Scheduled deletion of ${imagesToDelete.length} collection images`);
        }

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error deleting collection:", error);
        return {
            success: false,
            error: "Failed to delete collection",
        };
    }
}

// ============================================
// REORDER: Update collection positions
// ============================================
export async function reorderCollections(
    collectionOrders: Array<{ id: string; displayOrder: number }>
): Promise<ActionResult> {
    try {
        await db.transaction(async (tx) => {
            for (const { id, displayOrder } of collectionOrders) {
                await tx
                    .update(collections)
                    .set({ displayOrder, updatedAt: new Date() })
                    .where(eq(collections.id, id));
            }
        });

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error reordering collections:", error);
        return {
            success: false,
            error: "Failed to reorder collections",
        };
    }
}

// ============================================
// TOGGLE: Publish/unpublish collection
// ============================================
export async function toggleCollectionPublish(
    id: string,
    isPublished: boolean
): Promise<ActionResult> {
    try {
        await db
            .update(collections)
            .set({
                isPublished,
                updatedAt: new Date(),
            })
            .where(eq(collections.id, id));

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error toggling collection publish status:", error);
        return {
            success: false,
            error: "Failed to toggle publish status",
        };
    }
}

// ============================================
// PRODUCTS: Add/Remove products from collection
// ============================================
export async function addProductsToCollection(
    collectionId: string,
    productIds: string[]
): Promise<ActionResult<{ added: number; skipped: number; skippedProducts?: string[] }>> {
    try {
        // 1. Get existing product IDs in collection
        const existing = await db
            .select({ productId: productCollections.productId })
            .from(productCollections)
            .where(eq(productCollections.collectionId, collectionId));

        const existingIds = new Set(existing.map((e) => e.productId));

        // 2. Filter out duplicates
        const newProductIds = productIds.filter((id) => !existingIds.has(id));
        const skippedCount = productIds.length - newProductIds.length;

        if (newProductIds.length === 0) {
            return {
                success: false,
                error: "All products are already in this collection",
                data: {
                    added: 0,
                    skipped: skippedCount,
                },
            };
        }

        // 3. Get next sortOrder (append to end)
        const [lastProduct] = await db
            .select({ sortOrder: productCollections.sortOrder })
            .from(productCollections)
            .where(eq(productCollections.collectionId, collectionId))
            .orderBy(desc(productCollections.sortOrder))
            .limit(1);

        const nextSortOrder = (lastProduct?.sortOrder ?? -1) + 1;

        // 4. Insert only new products
        const values = newProductIds.map((productId, index) => ({
            collectionId,
            productId,
            sortOrder: nextSortOrder + index,
            addedAt: new Date(),
        }));

        await db.insert(productCollections).values(values);

        revalidatePath(`/collections`);
        revalidatePath('/dashboard/collections');

        return {
            success: true,
            data: {
                added: newProductIds.length,
                skipped: skippedCount,
            },
        };
    } catch (error) {
        console.error("Error adding products to collection:", error);
        return {
            success: false,
            error: "Failed to add products",
        };
    }
}

export async function removeProductFromCollection(
    collectionId: string,
    productId: string
): Promise<ActionResult> {
    try {
        await db
            .delete(productCollections)
            .where(
                and(
                    eq(productCollections.collectionId, collectionId),
                    eq(productCollections.productId, productId)
                )
            );

        revalidatePath(`/collections`);
        revalidatePath('/dashboard/collections');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error removing product from collection:", error);
        return {
            success: false,
            error: "Failed to remove product",
        };
    }
}

// ============================================
// GET: Products in a collection (for admin/edit)
// ============================================
export async function getCollectionProductsById(
    collectionId: string
): Promise<ActionResult<Array<{ id: string; name: string; sku: string | null }>>> {
    try {
        const collectionProducts = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
            })
            .from(productCollections)
            .innerJoin(products, eq(products.id, productCollections.productId))
            .where(eq(productCollections.collectionId, collectionId))
            .orderBy(asc(productCollections.sortOrder));

        return {
            success: true,
            data: collectionProducts,
        };
    } catch (error) {
        console.error("Error fetching collection products:", error);
        return {
            success: false,
            data: [],
            error: "Failed to fetch collection products",
        };
    }
}

// ============================================
// REORDER: Update product positions within collection
// ============================================
export async function reorderCollectionProducts(
    collectionId: string,
    productOrders: Array<{ productId: string; sortOrder: number }>
): Promise<ActionResult> {
    try {
        await db.transaction(async (tx) => {
            for (const { productId, sortOrder } of productOrders) {
                await tx
                    .update(productCollections)
                    .set({ sortOrder })
                    .where(
                        and(
                            eq(productCollections.collectionId, collectionId),
                            eq(productCollections.productId, productId)
                        )
                    );
            }
        });

        revalidatePath(`/collections`);
        revalidatePath('/dashboard/collections');

        return {
            success: true,
        };
    } catch (error) {
        console.error("Error reordering collection products:", error);
        return {
            success: false,
            error: "Failed to reorder products",
        };
    }
}

// ============================================
// DUPLICATE: Clone a collection with all products
// ============================================
export async function duplicateCollection(
    sourceId: string,
    newName: string
): Promise<ActionResult<{ collectionId: string }>> {
    try {
        // 1. Get source collection
        const [sourceCollection] = await db
            .select()
            .from(collections)
            .where(eq(collections.id, sourceId))
            .limit(1);

        if (!sourceCollection) {
            return {
                success: false,
                error: "Source collection not found",
            };
        }

        // 2. Generate unique slug
        const baseSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let slug = baseSlug;
        let counter = 1;

        while (true) {
            const [existing] = await db
                .select({ id: collections.id })
                .from(collections)
                .where(eq(collections.slug, slug))
                .limit(1);

            if (!existing) break;
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        // 3. Get next display order
        const [lastCollection] = await db
            .select({ displayOrder: collections.displayOrder })
            .from(collections)
            .orderBy(desc(collections.displayOrder))
            .limit(1);

        const nextDisplayOrder = (lastCollection?.displayOrder ?? -1) + 1;

        // 4. Create new collection
        const [newCollection] = await db
            .insert(collections)
            .values({
                name: newName,
                slug,
                description: sourceCollection.description,
                imageUrl: sourceCollection.imageUrl,
                thumbnailUrl: sourceCollection.thumbnailUrl,
                isPublished: false, // Start as draft
                isFeatured: false,
                displayOrder: nextDisplayOrder,
                metaTitle: sourceCollection.metaTitle,
                metaDescription: sourceCollection.metaDescription,
                updatedAt: new Date(),
            })
            .returning({ id: collections.id });

        // 5. Copy product assignments
        const sourceProducts = await db
            .select({
                productId: productCollections.productId,
                sortOrder: productCollections.sortOrder,
            })
            .from(productCollections)
            .where(eq(productCollections.collectionId, sourceId))
            .orderBy(asc(productCollections.sortOrder));

        if (sourceProducts.length > 0) {
            const productValues = sourceProducts.map((p) => ({
                collectionId: newCollection.id,
                productId: p.productId,
                sortOrder: p.sortOrder,
                addedAt: new Date(),
            }));

            await db.insert(productCollections).values(productValues);
        }

        revalidatePath('/collections');
        revalidatePath('/dashboard/collections');

        return {
            success: true,
            data: { collectionId: newCollection.id },
        };
    } catch (error) {
        console.error("Error duplicating collection:", error);
        return {
            success: false,
            error: "Failed to duplicate collection",
        };
    }
}
