// src/lib/actions/hero-slides-search.ts
"use server";

import { db } from "@/lib/db";
import { products } from "@/lib/db/schema/products";
import { collections } from "@/lib/db/schema/collections";
import { ilike, or, eq } from "drizzle-orm";

export type SearchResult<T> = {
    success: boolean;
    data: T[];
    hasMore: boolean;
    error?: string;
};

/**
 * Search products with pagination and filtering
 * Only fetches when needed (on-demand)
 */
export async function searchProducts(
    query: string = "",
    limit: number = 20,
    offset: number = 0
): Promise<SearchResult<{ id: string; name: string; sku: string | null }>> {
    try {
        // Build search condition
        const searchCondition = query.trim()
            ? or(
                ilike(products.name, `%${query}%`),
                ilike(products.sku, `%${query}%`)
            )
            : undefined;

        // Fetch limit + 1 to check if there are more results
        const results = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
            })
            .from(products)
            .where(
                searchCondition
                    ? searchCondition
                    : eq(products.isPublished, true)
            )
            .limit(limit + 1)
            .offset(offset);

        // Check if there are more results
        const hasMore = results.length > limit;
        const data = hasMore ? results.slice(0, limit) : results;

        return {
            success: true,
            data,
            hasMore,
        };
    } catch (error) {
        console.error("Error searching products:", error);
        return {
            success: false,
            data: [],
            hasMore: false,
            error: "Failed to search products",
        };
    }
}

/**
 * Search collections with pagination and filtering
 * Only fetches when needed (on-demand)
 */
export async function searchCollections(
    query: string = "",
    limit: number = 20,
    offset: number = 0
): Promise<SearchResult<{ id: string; name: string; slug: string }>> {
    try {
        const searchCondition = query.trim()
            ? or(
                ilike(collections.name, `%${query}%`),
                ilike(collections.slug, `%${query}%`)
            )
            : undefined;

        const results = await db
            .select({
                id: collections.id,
                name: collections.name,
                slug: collections.slug,
            })
            .from(collections)
            .where(searchCondition)
            .limit(limit + 1)
            .offset(offset);

        const hasMore = results.length > limit;
        const data = hasMore ? results.slice(0, limit) : results;

        return {
            success: true,
            data,
            hasMore,
        };
    } catch (error) {
        console.error("Error searching collections:", error);
        return {
            success: false,
            data: [],
            hasMore: false,
            error: "Failed to search collections",
        };
    }
}

/**
 * Get a single product by ID (for displaying selected value)
 */
export async function getProductById(id: string) {
    try {
        const [product] = await db
            .select({
                id: products.id,
                name: products.name,
                sku: products.sku,
            })
            .from(products)
            .where(eq(products.id, id))
            .limit(1);

        return product || null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

/**
 * Get a single collection by ID (for displaying selected value)
 */
export async function getCollectionById(id: string) {
    try {
        const [collection] = await db
            .select({
                id: collections.id,
                name: collections.name,
                slug: collections.slug,
            })
            .from(collections)
            .where(eq(collections.id, id))
            .limit(1);

        return collection || null;
    } catch (error) {
        console.error("Error fetching collection:", error);
        return null;
    }
}