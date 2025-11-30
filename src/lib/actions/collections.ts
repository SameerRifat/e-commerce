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
import { eq, asc, and, or, lte, gte, isNull, ilike, desc, sql, inArray, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    manualSortOrder?: number; // Only for manual collections
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
// ============================================
export async function getCollectionProducts(
    slug: string,
    page: number = 1,
    limit: number = 24,
    sort: SortOption = "featured"
): Promise<CollectionData | null> {
    try {
        // 1. Get collection
        const [collection] = await db
            .select()
            .from(collections)
            .where(
                and(
                    eq(collections.slug, slug),
                    eq(collections.isPublished, true),
                    // Optional: Check scheduling
                    or(
                        isNull(collections.publishedAt),
                        lte(collections.publishedAt, new Date())
                    ),
                    or(
                        isNull(collections.expiresAt),
                        gte(collections.expiresAt, new Date())
                    )
                )
            )
            .limit(1);

        if (!collection) return null;

        // 2. Get product IDs based on collection type
        let productIds: Array<{ id: string; sortOrder?: number }>;

        if (collection.collectionType === 'manual') {
            // Manual: Get from junction table
            const manualProducts = await db
                .select({
                    id: productCollections.productId,
                    sortOrder: productCollections.sortOrder,
                })
                .from(productCollections)
                .where(eq(productCollections.collectionId, collection.id))
                .orderBy(asc(productCollections.sortOrder));
            
            // Convert null to undefined
            productIds = manualProducts.map(p => ({
                id: p.id,
                sortOrder: p.sortOrder ?? undefined,
            }));
        } else {
            // Automated: Get from rules
            const matchingIds = await getProductIdsByAutomationRules(
                collection.automationRules as AutomationRules | null
            );
            productIds = matchingIds.map(id => ({ id }));
        }

        if (productIds.length === 0) {
            return {
                collection,
                products: [],
                totalCount: 0,
                hasMore: false,
            };
        }

        // 3. Build full product query with all necessary data
        const productIdList = productIds.map(p => p.id);
        
        // Images subquery
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

        // Reviews subquery
        const reviewsJoin = db
            .select({
                productId: reviews.productId,
                avgRating: sql<number | null>`avg(${reviews.rating})`.as("avg_rating"),
                reviewCount: sql<number>`count(${reviews.id})::int`.as("review_count"),
            })
            .from(reviews)
            .groupBy(reviews.productId)
            .as("r");

        // Variants subquery for pricing
        const variantJoin = db
            .select({
                productId: productVariants.productId,
                price: sql<number>`${productVariants.price}::numeric`.as("variant_price"),
                salePrice: sql<number | null>`${productVariants.salePrice}::numeric`.as("variant_sale_price"),
                effectivePrice: sql<number>`COALESCE(${productVariants.salePrice}::numeric, ${productVariants.price}::numeric)`.as("effective_price"),
            })
            .from(productVariants)
            .as("v");

        // Price aggregations
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

        // 4. Determine sort order
        let orderBy: SQL[];
        
        if (collection.collectionType === 'manual' && sort === 'featured') {
            // For manual collections with "featured" sort, use manual sortOrder
            // We'll sort in memory after fetching since we need to join sortOrder
            orderBy = [asc(products.id) as SQL]; // Temporary order
        } else {
            // Use standard sorting
            const SORT_MAPPINGS = {
                price_asc: [asc(effectivePriceAgg) as SQL, desc(products.createdAt) as SQL, asc(products.id) as SQL],
                price_desc: [desc(effectivePriceAgg) as SQL, desc(products.createdAt) as SQL, asc(products.id) as SQL],
                newest: [desc(products.createdAt) as SQL, asc(products.id) as SQL],
                featured: [desc(products.createdAt) as SQL, asc(products.id) as SQL],
            } as const;
            orderBy = [...SORT_MAPPINGS[sort]];
        }

        // 5. Query products
        const allProducts = await db
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
                    inArray(products.id, productIdList),
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

        // 6. Apply manual sort order if needed
        let sortedProducts = allProducts;
        if (collection.collectionType === 'manual' && sort === 'featured') {
            const sortOrderMap = new Map(productIds.map(p => [p.id, p.sortOrder ?? 999]));
            sortedProducts = allProducts.sort((a, b) => {
                const orderA = sortOrderMap.get(a.id) ?? 999;
                const orderB = sortOrderMap.get(b.id) ?? 999;
                return orderA - orderB;
            });
        }

        // 7. Apply pagination
        const totalCount = sortedProducts.length;
        const offset = (page - 1) * limit;
        const paginatedProducts = sortedProducts.slice(offset, offset + limit);

        // 8. Format results
        const formattedProducts: CollectionProduct[] = paginatedProducts.map((p) => ({
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
// Helper: Get product IDs by automation rules
// ============================================
type AutomationRule = {
    field: string;
    operator: 'equals' | 'in' | 'gte' | 'lte' | 'gt' | 'lt';
    value: string | number | boolean | string[] | number[] | null;
};

type AutomationRules = {
    conditions: 'AND' | 'OR';
    rules: AutomationRule[];
};

async function getProductIdsByAutomationRules(
    rules: AutomationRules | null
): Promise<string[]> {
    if (!rules || !rules.rules || rules.rules.length === 0) {
        return [];
    }

    // Build conditions from rules
    const conditions: SQL[] = [];
    
    for (const rule of rules.rules) {
        // Type-safe field access
        const validFields = ['categoryId', 'brandId', 'genderId', 'price', 'createdAt'] as const;
        type ValidField = typeof validFields[number];
        if (!validFields.includes(rule.field as ValidField)) {
            console.warn(`Invalid automation rule field: ${rule.field}`);
            continue;
        }

        const field = products[rule.field as keyof typeof products.$inferSelect];
        if (!field) continue;

        try {
            switch (rule.operator) {
                case 'equals':
                    conditions.push(eq(field, rule.value as string | number | boolean));
                    break;
                case 'in':
                    if (Array.isArray(rule.value) && rule.value.length > 0) {
                        conditions.push(inArray(field, rule.value as (string | number)[]));
                    }
                    break;
                case 'gte':
                    conditions.push(gte(field, rule.value as number));
                    break;
                case 'lte':
                    conditions.push(lte(field, rule.value as number));
                    break;
                case 'gt':
                    conditions.push(sql`${field} > ${rule.value}`);
                    break;
                case 'lt':
                    conditions.push(sql`${field} < ${rule.value}`);
                    break;
            }
        } catch (error) {
            console.warn(`Error building automation rule condition:`, rule, error);
        }
    }

    if (conditions.length === 0) return [];

    // Combine conditions with AND/OR
    const whereClause = rules.conditions === 'AND'
        ? and(eq(products.isPublished, true), ...conditions)
        : and(eq(products.isPublished, true), or(...conditions));

    // Query just the IDs
    const result = await db
        .select({ id: products.id })
        .from(products)
        .where(whereClause);

    return result.map(r => r.id);
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
        const now = new Date();

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
                collectionType: collections.collectionType,
                automationRules: collections.automationRules,
                metaTitle: collections.metaTitle,
                metaDescription: collections.metaDescription,
                publishedAt: collections.publishedAt,
                expiresAt: collections.expiresAt,
                createdAt: collections.createdAt,
                updatedAt: collections.updatedAt,
                productCount: sql<number>`count(distinct ${productCollections.productId})::int`,
            })
            .from(collections)
            .leftJoin(productCollections, eq(productCollections.collectionId, collections.id))
            .where(
                and(
                    eq(collections.isPublished, true),
                    or(
                        isNull(collections.publishedAt),
                        lte(collections.publishedAt, now)
                    ),
                    or(
                        isNull(collections.expiresAt),
                        gte(collections.expiresAt, now)
                    )
                )
            )
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
        const now = new Date();

        const featured = await db
            .select()
            .from(collections)
            .where(
                and(
                    eq(collections.isPublished, true),
                    eq(collections.isFeatured, true),
                    or(
                        isNull(collections.publishedAt),
                        lte(collections.publishedAt, now)
                    ),
                    or(
                        isNull(collections.expiresAt),
                        gte(collections.expiresAt, now)
                    )
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
                collectionType: collections.collectionType,
                automationRules: collections.automationRules,
                metaTitle: collections.metaTitle,
                metaDescription: collections.metaDescription,
                publishedAt: collections.publishedAt,
                expiresAt: collections.expiresAt,
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

        // Update
        await db
            .update(collections)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(collections.id, id));

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
                publishedAt: isPublished ? new Date() : undefined,
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
// PRODUCTS: Add/Remove products from manual collection
// ============================================
export async function addProductsToCollection(
    collectionId: string,
    productIds: string[]
): Promise<ActionResult> {
    try {
        const values = productIds.map((productId, index) => ({
            collectionId,
            productId,
            sortOrder: index,
            addedAt: new Date(),
        }));

        await db.insert(productCollections).values(values);

        revalidatePath(`/collections`);
        revalidatePath('/dashboard/collections');

        return {
            success: true,
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