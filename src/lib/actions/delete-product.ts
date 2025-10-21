// src/lib/actions/delete-product.ts
"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, pool } from "@/lib/db";
import {
    products,
    productVariants,
    productImages,
    orderItems,
    cartItems,
    wishlists,
    reviews,
    productCollections,
    heroSlides,
} from "@/lib/db/schema";
import type { ActionResult } from "@/types/dashboard";

interface DeleteProductResult {
    success: boolean;
    error?: string;
    canDelete?: boolean;
    reason?: string;
    relatedOrders?: number;
}

/**
 * Check if a product can be safely deleted
 * Products with orders cannot be deleted to maintain order history integrity
 */
export async function checkProductDeletion(
    productId: string
): Promise<DeleteProductResult> {
    try {
        // Check if product exists
        const product = await db.query.products.findFirst({
            where: eq(products.id, productId),
            columns: { id: true, productType: true },
        });

        if (!product) {
            return {
                success: false,
                canDelete: false,
                reason: "Product not found",
            };
        }

        // Check for related orders (both simple and configurable products)
        const relatedOrderItems = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(orderItems)
            .where(
                product.productType === "simple"
                    ? eq(orderItems.productId, productId)
                    : sql`${orderItems.productVariantId} IN (
              SELECT ${productVariants.id} 
              FROM ${productVariants} 
              WHERE ${productVariants.productId} = ${productId}
            )`
            );

        const orderCount = relatedOrderItems[0]?.count || 0;

        if (orderCount > 0) {
            return {
                success: false,
                canDelete: false,
                reason: "Cannot delete product with existing orders",
                relatedOrders: orderCount,
            };
        }

        return {
            success: true,
            canDelete: true,
        };
    } catch (error) {
        console.error("Error checking product deletion:", error);
        return {
            success: false,
            canDelete: false,
            reason: "Failed to verify product deletion eligibility",
        };
    }
}

/**
 * Delete a product and all its related data
 * Uses a transaction to ensure data integrity
 */
export async function deleteProduct(
    productId: string
): Promise<ActionResult<{ deletedId: string }>> {
    try {
        // First check if product can be deleted
        const checkResult = await checkProductDeletion(productId);

        if (!checkResult.canDelete) {
            return {
                success: false,
                error: checkResult.reason || "Cannot delete this product",
            };
        }

        // Use transaction for atomic deletion
        const result = await db.transaction(async (tx) => {
            // Get product info for cleanup
            const product = await tx.query.products.findFirst({
                where: eq(products.id, productId),
                columns: { id: true, productType: true },
            });

            if (!product) {
                throw new Error("Product not found");
            }

            // 1. Delete from hero_slides (set linked_product_id to null)
            await tx
                .update(heroSlides)
                .set({ linkedProductId: null })
                .where(eq(heroSlides.linkedProductId, productId));

            // 2. Delete from product_collections
            await tx
                .delete(productCollections)
                .where(eq(productCollections.productId, productId));

            // 3. Delete reviews
            await tx
                .delete(reviews)
                .where(eq(reviews.productId, productId));

            // 4. Delete wishlists
            await tx
                .delete(wishlists)
                .where(eq(wishlists.productId, productId));

            // 5. Delete cart items (both simple and variants)
            if (product.productType === "simple") {
                await tx
                    .delete(cartItems)
                    .where(eq(cartItems.productId, productId));
            } else {
                // For configurable products, delete cart items with variants
                const variantIds = await tx
                    .select({ id: productVariants.id })
                    .from(productVariants)
                    .where(eq(productVariants.productId, productId));

                if (variantIds.length > 0) {
                    await tx
                        .delete(cartItems)
                        .where(
                            sql`${cartItems.productVariantId} IN (${sql.join(
                                variantIds.map((v) => sql`${v.id}`),
                                sql`, `
                            )})`
                        );
                }
            }

            // 6. Delete product images (CASCADE will handle this, but explicit is safer)
            await tx
                .delete(productImages)
                .where(eq(productImages.productId, productId));

            // 7. Delete product variants (CASCADE will handle this)
            await tx
                .delete(productVariants)
                .where(eq(productVariants.productId, productId));

            // 8. Finally, delete the product
            await tx.delete(products).where(eq(products.id, productId));

            return { deletedId: productId };
        });

        // Revalidate the products page to reflect changes
        revalidatePath("/dashboard/products");

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error("Error deleting product:", error);
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete product. Please try again.",
        };
    }
}

/**
 * Bulk delete multiple products
 * Validates each product before deletion
 */
export async function bulkDeleteProducts(
    productIds: string[]
): Promise<ActionResult<{ deletedCount: number; failedProducts: string[] }>> {
    try {
        if (!productIds.length) {
            return {
                success: false,
                error: "No products selected for deletion",
            };
        }

        const deletedProducts: string[] = [];
        const failedProducts: string[] = [];

        // Check and delete each product
        for (const productId of productIds) {
            const result = await deleteProduct(productId);
            if (result.success) {
                deletedProducts.push(productId);
            } else {
                failedProducts.push(productId);
            }
        }

        // Revalidate once after all deletions
        if (deletedProducts.length > 0) {
            revalidatePath("/dashboard/products");
        }

        return {
            success: true,
            data: {
                deletedCount: deletedProducts.length,
                failedProducts,
            },
        };
    } catch (error) {
        console.error("Error bulk deleting products:", error);
        return {
            success: false,
            error: "Failed to delete products. Please try again.",
        };
    }
}