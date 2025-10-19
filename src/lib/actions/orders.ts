// src/lib/actions/orders.ts
"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  products,
  productVariants,
  productImages,
  colors,
  sizes,
  addresses,
  reviews,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa';

// ✅ ENHANCED: Review status aligned with unified types
export interface OrderWithDetails {
  id: string;
  userId: string | null;
  status: OrderStatus;
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  shippingAddress?: {
    id: string;
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    phone: string | null;
    type: 'shipping' | 'billing';
  } | null;
  billingAddress?: {
    id: string;
    fullName: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    phone: string | null;
    type: 'shipping' | 'billing';
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: number;
    salePriceAtPurchase: number | null;
    isSimpleProduct: boolean;
    product?: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      images: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
      }>;
    };
    variant?: {
      id: string;
      sku: string;
      product: {
        id: string;
        name: string;
        slug: string;
      };
      color: {
        id: string;
        name: string;
        hexCode: string;
      } | null;
      size: {
        id: string;
        name: string;
      } | null;
      images: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
      }>;
    };
    reviewStatus?: {
      hasReview: boolean;
      reviewId?: string;
      rating?: number;
      comment?: string | null;
    };
  }>;
}

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

/**
 * ✅ OPTIMIZED: Get order by ID with full details including review statuses
 * NO N+1 queries - all data fetched in efficient batches with JOINs
 */
export async function getOrder(orderId: string): Promise<{
  success: boolean;
  order?: OrderWithDetails;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    // Query 1: Get basic order data
    const [orderData] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        paymentMethod: orders.paymentMethod,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddressId: orders.shippingAddressId,
        billingAddressId: orders.billingAddressId,
      })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, user.id)
      ))
      .limit(1);

    if (!orderData) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    // Collect address IDs to fetch
    const addressIds = [
      orderData.shippingAddressId,
      ...(orderData.billingAddressId && orderData.billingAddressId !== orderData.shippingAddressId 
        ? [orderData.billingAddressId] 
        : [])
    ].filter(Boolean) as string[];

    // Query 2: Get all order items at once
    const orderItemsData = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        salePriceAtPurchase: orderItems.salePriceAtPurchase,
        isSimpleProduct: orderItems.isSimpleProduct,
        productId: orderItems.productId,
        productVariantId: orderItems.productVariantId,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    if (orderItemsData.length === 0) {
      // Order exists but has no items - still valid
      const addressMap = new Map();
      if (addressIds.length > 0) {
        const addressesData = await db
          .select()
          .from(addresses)
          .where(inArray(addresses.id, addressIds));
        addressesData.forEach(addr => addressMap.set(addr.id, addr));
      }

      return {
        success: true,
        order: {
          id: orderData.id,
          userId: orderData.userId,
          status: orderData.status,
          totalAmount: parseFloat(orderData.totalAmount),
          subtotal: parseFloat(orderData.subtotal),
          shippingCost: parseFloat(orderData.shippingCost),
          taxAmount: parseFloat(orderData.taxAmount),
          paymentMethod: orderData.paymentMethod as PaymentMethod,
          notes: orderData.notes,
          createdAt: orderData.createdAt,
          updatedAt: orderData.updatedAt,
          shippingAddress: orderData.shippingAddressId ? addressMap.get(orderData.shippingAddressId) || null : null,
          billingAddress: orderData.billingAddressId ? addressMap.get(orderData.billingAddressId) || null : null,
          items: [],
        },
      };
    }

    // Collect all unique product and variant IDs
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    orderItemsData.forEach(item => {
      if (item.productId) productIds.add(item.productId);
      if (item.productVariantId) variantIds.add(item.productVariantId);
    });

    // Query 3: Batch fetch all addresses
    const addressMap = new Map();
    if (addressIds.length > 0) {
      const addressesData = await db
        .select()
        .from(addresses)
        .where(inArray(addresses.id, addressIds));
      addressesData.forEach(addr => addressMap.set(addr.id, addr));
    }

    // Query 4: Batch fetch all products
    const productsMap = new Map();
    if (productIds.size > 0) {
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          sku: products.sku,
        })
        .from(products)
        .where(inArray(products.id, Array.from(productIds)));
      productsData.forEach(p => productsMap.set(p.id, p));
    }

    // Query 5: Batch fetch all variants with joins
    const variantsMap = new Map();
    const variantProductIds = new Set<string>();

    if (variantIds.size > 0) {
      const variantsData = await db
        .select({
          variantId: productVariants.id,
          variantSku: productVariants.sku,
          productId: productVariants.productId,
          productName: products.name,
          productSlug: products.slug,
          colorId: colors.id,
          colorName: colors.name,
          colorHexCode: colors.hexCode,
          sizeId: sizes.id,
          sizeName: sizes.name,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .leftJoin(colors, eq(colors.id, productVariants.colorId))
        .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
        .where(inArray(productVariants.id, Array.from(variantIds)));

      variantsData.forEach(v => {
        variantsMap.set(v.variantId, v);
        variantProductIds.add(v.productId);
      });
    }

    // Combine all product IDs for image fetching
    const allProductIdsForImages = new Set([...productIds, ...variantProductIds]);

    // Query 6: Batch fetch all images
    const imagesMap = new Map<string, ProductImage[]>();

    if (allProductIdsForImages.size > 0) {
      const imagesData = await db
        .select({
          id: productImages.id,
          url: productImages.url,
          isPrimary: productImages.isPrimary,
          productId: productImages.productId,
          variantId: productImages.variantId,
        })
        .from(productImages)
        .where(inArray(productImages.productId, Array.from(allProductIdsForImages)))
        .orderBy(desc(productImages.isPrimary));

      imagesData.forEach(img => {
        if (img.variantId) {
          if (!imagesMap.has(img.variantId)) {
            imagesMap.set(img.variantId, []);
          }
          imagesMap.get(img.variantId)!.push({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary || false,
          });
        }

        if (!img.variantId) {
          if (!imagesMap.has(img.productId)) {
            imagesMap.set(img.productId, []);
          }
          imagesMap.get(img.productId)!.push({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary || false,
          });
        }
      });
    }

    // Query 7: Batch fetch ALL reviews for these products (single query!)
    const reviewsMap = new Map<string, { id: string; rating: number; comment: string | null }>();
    
    if (productIds.size > 0) {
      const reviewsData = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          rating: reviews.rating,
          comment: reviews.comment,
        })
        .from(reviews)
        .where(
          and(
            inArray(reviews.productId, Array.from(productIds)),
            eq(reviews.userId, user.id)
          )
        );

      reviewsData.forEach(review => {
        reviewsMap.set(review.productId, {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
        });
      });
    }

    // Build processed items using cached data
    const processedItems = orderItemsData
      .map(item => {
        if (item.isSimpleProduct && item.productId) {
          const product = productsMap.get(item.productId);
          if (!product) return null;

          const images = imagesMap.get(item.productId) || [];
          const review = reviewsMap.get(item.productId);

          return {
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.priceAtPurchase),
            salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
            isSimpleProduct: true,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              sku: product.sku || '',
              images,
            },
            reviewStatus: review ? {
              hasReview: true,
              reviewId: review.id,
              rating: review.rating,
              comment: review.comment,
            } : {
              hasReview: false,
            },
          };
        } else if (!item.isSimpleProduct && item.productVariantId) {
          const variant = variantsMap.get(item.productVariantId);
          if (!variant) return null;

          const variantImages = imagesMap.get(item.productVariantId) || [];
          const productImages = imagesMap.get(variant.productId) || [];
          const images = variantImages.length > 0 ? variantImages : productImages;
          const review = reviewsMap.get(variant.productId);

          return {
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.priceAtPurchase),
            salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
            isSimpleProduct: false,
            variant: {
              id: variant.variantId,
              sku: variant.variantSku,
              product: {
                id: variant.productId,
                name: variant.productName,
                slug: variant.productSlug,
              },
              color: variant.colorId ? {
                id: variant.colorId,
                name: variant.colorName!,
                hexCode: variant.colorHexCode!,
              } : null,
              size: variant.sizeId ? {
                id: variant.sizeId,
                name: variant.sizeName!,
              } : null,
              images,
            },
            reviewStatus: review ? {
              hasReview: true,
              reviewId: review.id,
              rating: review.rating,
              comment: review.comment,
            } : {
              hasReview: false,
            },
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const result: OrderWithDetails = {
      id: orderData.id,
      userId: orderData.userId,
      status: orderData.status,
      totalAmount: parseFloat(orderData.totalAmount),
      subtotal: parseFloat(orderData.subtotal),
      shippingCost: parseFloat(orderData.shippingCost),
      taxAmount: parseFloat(orderData.taxAmount),
      paymentMethod: orderData.paymentMethod as PaymentMethod,
      notes: orderData.notes,
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,
      shippingAddress: orderData.shippingAddressId ? addressMap.get(orderData.shippingAddressId) || null : null,
      billingAddress: orderData.billingAddressId ? addressMap.get(orderData.billingAddressId) || null : null,
      items: processedItems,
    };

    return {
      success: true,
      order: result,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      error: "Failed to fetch order details.",
    };
  }
}

/**
 * ✅ OPTIMIZED: Get user's orders with efficient batch queries INCLUDING review statuses
 * NO N+1 queries - all related data including reviews fetched in parallel batches
 */
export async function getUserOrders(): Promise<{
  success: boolean;
  orders?: OrderWithDetails[];
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    // Query 1: Get basic order data
    const userOrdersData = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        subtotal: orders.subtotal,
        shippingCost: orders.shippingCost,
        taxAmount: orders.taxAmount,
        paymentMethod: orders.paymentMethod,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        shippingAddressId: orders.shippingAddressId,
        billingAddressId: orders.billingAddressId,
      })
      .from(orders)
      .where(eq(orders.userId, user.id))
      .orderBy(desc(orders.createdAt));

    if (userOrdersData.length === 0) {
      return {
        success: true,
        orders: [],
      };
    }

    const orderIds = userOrdersData.map(order => order.id);

    // Query 2: Batch fetch all addresses
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    const addressMap = new Map(userAddresses.map(addr => [addr.id, addr]));

    // Query 3: Batch fetch ALL order items
    const allOrderItems = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        salePriceAtPurchase: orderItems.salePriceAtPurchase,
        isSimpleProduct: orderItems.isSimpleProduct,
        productId: orderItems.productId,
        productVariantId: orderItems.productVariantId,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const orderItemsMap = new Map<string, typeof allOrderItems>();
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    allOrderItems.forEach(item => {
      if (!orderItemsMap.has(item.orderId)) {
        orderItemsMap.set(item.orderId, []);
      }
      orderItemsMap.get(item.orderId)!.push(item);

      if (item.productId) productIds.add(item.productId);
      if (item.productVariantId) variantIds.add(item.productVariantId);
    });

    // Query 4: Batch fetch all products
    const productsMap = new Map();
    if (productIds.size > 0) {
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          slug: products.slug,
          sku: products.sku,
        })
        .from(products)
        .where(inArray(products.id, Array.from(productIds)));

      productsData.forEach(p => productsMap.set(p.id, p));
    }

    // Query 5: Batch fetch all variants with joins
    const variantsMap = new Map();
    const variantProductIds = new Set<string>();

    if (variantIds.size > 0) {
      const variantsData = await db
        .select({
          variantId: productVariants.id,
          variantSku: productVariants.sku,
          productId: productVariants.productId,
          productName: products.name,
          productSlug: products.slug,
          colorId: colors.id,
          colorName: colors.name,
          colorHexCode: colors.hexCode,
          sizeId: sizes.id,
          sizeName: sizes.name,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .leftJoin(colors, eq(colors.id, productVariants.colorId))
        .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
        .where(inArray(productVariants.id, Array.from(variantIds)));

      variantsData.forEach(v => {
        variantsMap.set(v.variantId, v);
        variantProductIds.add(v.productId);
      });
    }

    // Combine all product IDs
    const allProductIdsForImages = new Set([...productIds, ...variantProductIds]);

    // Query 6: Batch fetch all images
    const imagesMap = new Map<string, ProductImage[]>();

    if (allProductIdsForImages.size > 0) {
      const imagesData = await db
        .select({
          id: productImages.id,
          url: productImages.url,
          isPrimary: productImages.isPrimary,
          productId: productImages.productId,
          variantId: productImages.variantId,
        })
        .from(productImages)
        .where(inArray(productImages.productId, Array.from(allProductIdsForImages)))
        .orderBy(desc(productImages.isPrimary));

      imagesData.forEach(img => {
        if (img.variantId) {
          if (!imagesMap.has(img.variantId)) {
            imagesMap.set(img.variantId, []);
          }
          imagesMap.get(img.variantId)!.push({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary || false,
          });
        }

        if (!img.variantId) {
          if (!imagesMap.has(img.productId)) {
            imagesMap.set(img.productId, []);
          }
          imagesMap.get(img.productId)!.push({
            id: img.id,
            url: img.url,
            isPrimary: img.isPrimary || false,
          });
        }
      });
    }

    // Query 7: Batch fetch ALL reviews for ALL products (single query!)
    const reviewsMap = new Map<string, { id: string; rating: number; comment: string | null }>();
    
    if (allProductIdsForImages.size > 0) {
      const reviewsData = await db
        .select({
          id: reviews.id,
          productId: reviews.productId,
          rating: reviews.rating,
          comment: reviews.comment,
        })
        .from(reviews)
        .where(
          and(
            inArray(reviews.productId, Array.from(allProductIdsForImages)),
            eq(reviews.userId, user.id)
          )
        );

      reviewsData.forEach(review => {
        reviewsMap.set(review.productId, {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
        });
      });
    }

    // Build all orders from cached data
    const processedOrders: OrderWithDetails[] = userOrdersData.map(orderData => {
      const shippingAddress = orderData.shippingAddressId
        ? addressMap.get(orderData.shippingAddressId) || null
        : null;

      const billingAddress = orderData.billingAddressId &&
        orderData.billingAddressId !== orderData.shippingAddressId
        ? addressMap.get(orderData.billingAddressId) || null
        : null;

      const itemsForThisOrder = orderItemsMap.get(orderData.id) || [];

      const processedItems = itemsForThisOrder
        .map(item => {
          if (item.isSimpleProduct && item.productId) {
            const product = productsMap.get(item.productId);
            if (!product) return null;

            const images = (imagesMap.get(item.productId) || []).slice(0, 3);
            const review = reviewsMap.get(item.productId);

            return {
              id: item.id,
              quantity: item.quantity,
              priceAtPurchase: parseFloat(item.priceAtPurchase),
              salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
              isSimpleProduct: true,
              product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                sku: product.sku || '',
                images,
              },
              reviewStatus: review ? {
                hasReview: true,
                reviewId: review.id,
                rating: review.rating,
                comment: review.comment,
              } : {
                hasReview: false,
              },
            };
          } else if (!item.isSimpleProduct && item.productVariantId) {
            const variant = variantsMap.get(item.productVariantId);
            if (!variant) return null;

            const variantImages = imagesMap.get(item.productVariantId) || [];
            const productImages = imagesMap.get(variant.productId) || [];
            const images = (variantImages.length > 0 ? variantImages : productImages).slice(0, 3);
            const review = reviewsMap.get(variant.productId);

            return {
              id: item.id,
              quantity: item.quantity,
              priceAtPurchase: parseFloat(item.priceAtPurchase),
              salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
              isSimpleProduct: false,
              variant: {
                id: variant.variantId,
                sku: variant.variantSku,
                product: {
                  id: variant.productId,
                  name: variant.productName,
                  slug: variant.productSlug,
                },
                color: variant.colorId ? {
                  id: variant.colorId,
                  name: variant.colorName!,
                  hexCode: variant.colorHexCode!,
                } : null,
                size: variant.sizeId ? {
                  id: variant.sizeId,
                  name: variant.sizeName!,
                } : null,
                images,
              },
              reviewStatus: review ? {
                hasReview: true,
                reviewId: review.id,
                rating: review.rating,
                comment: review.comment,
              } : {
                hasReview: false,
              },
            };
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      return {
        id: orderData.id,
        userId: orderData.userId,
        status: orderData.status,
        totalAmount: parseFloat(orderData.totalAmount),
        subtotal: parseFloat(orderData.subtotal),
        shippingCost: parseFloat(orderData.shippingCost),
        taxAmount: parseFloat(orderData.taxAmount),
        paymentMethod: orderData.paymentMethod as PaymentMethod,
        notes: orderData.notes,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        shippingAddress,
        billingAddress,
        items: processedItems,
      };
    });

    return {
      success: true,
      orders: processedOrders,
    };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders. Please try again later.",
    };
  }
}

// Update order status (admin function)
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    // Get current order status
    const [currentOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    // If cancelling an order, restore inventory
    if (status === 'cancelled' && currentOrder.status !== 'cancelled') {
      await restoreInventory(orderId);
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id });

    if (!updatedOrder) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    revalidatePath("/profile/orders");
    revalidatePath(`/profile/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: "Failed to update order status.",
    };
  }
}

// Cancel order
export async function cancelOrder(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    // Check if order exists and belongs to user
    const order = await db
      .select({
        id: orders.id,
        status: orders.status,
      })
      .from(orders)
      .where(and(
        eq(orders.id, orderId),
        eq(orders.userId, user.id)
      ))
      .limit(1);

    if (!order.length) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    // Only allow cancellation of pending orders
    if (order[0].status !== 'pending') {
      return {
        success: false,
        error: "Only pending orders can be cancelled.",
      };
    }

    // Restore inventory
    await restoreInventory(orderId);

    // Update order status to cancelled
    await db
      .update(orders)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    revalidatePath("/profile/orders");
    revalidatePath(`/profile/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Error cancelling order:", error);
    return {
      success: false,
      error: "Failed to cancel order.",
    };
  }
}

// Restore inventory when order is cancelled (private helper function)
async function restoreInventory(orderId: string): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      // Get all order items for this order
      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      // Restore stock for each item
      for (const item of items) {
        if (item.isSimpleProduct && item.productId) {
          await tx
            .update(products)
            .set({
              inStock: sql`${products.inStock} + ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId));
        } else if (!item.isSimpleProduct && item.productVariantId) {
          await tx
            .update(productVariants)
            .set({
              inStock: sql`${productVariants.inStock} + ${item.quantity}`,
            })
            .where(eq(productVariants.id, item.productVariantId));
        }
      }
    });
  } catch (error) {
    console.error("Error restoring inventory:", error);
    // Log but don't throw - inventory restoration failure shouldn't block cancellation
  }
}