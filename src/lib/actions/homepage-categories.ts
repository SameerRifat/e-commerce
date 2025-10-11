// src/lib/actions/homepage-categories.ts
"use server";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { sql, asc } from "drizzle-orm";

// Simplified type for homepage category display
export interface HomepageCategory {
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    linkUrl: string;
}

/**
 * Get categories for homepage carousel
 * Returns only root categories (Level 1) from database
 */
export async function getHomepageCategories(): Promise<HomepageCategory[]> {
    try {
        // Fetch root categories (Level 1) only
        const rootCategories = await db
            .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                imageUrl: categories.imageUrl,
            })
            .from(categories)
            .where(sql`${categories.parentId} IS NULL`)
            .orderBy(asc(categories.name));

        // Transform to homepage format
        return rootCategories.map(cat => ({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            imageUrl: cat.imageUrl || "/categories/default-category.webp",
            linkUrl: `/products?category=${cat.slug}`,
        }));
    } catch (error) {
        console.error("Error fetching homepage categories:", error);
        return [];
    }
}