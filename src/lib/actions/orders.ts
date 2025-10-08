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
  addresses
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/actions";
import { clearCart } from "./cart";
import { eq, and, desc, asc, inArray, sql, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CartItemWithDetails } from "./cart";
import type { CheckoutData } from "@/lib/utils/order-helpers";
import type { OrderCalculation } from "@/lib/utils/order-helpers";

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

// Enhanced order type with related data
export interface OrderWithDetails {
  id: string;
  userId: string | null;
  status: OrderStatus; // FIXED: Using complete OrderStatus type
  totalAmount: number;
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  paymentMethod: string;
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
  }>;
}

// Create order from checkout data with inventory deduction
export async function createOrder(data: {
  cartItems: CartItemWithDetails[];
  calculation: OrderCalculation;
  checkoutData: CheckoutData;
  userId: string;
}): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const { cartItems, calculation, checkoutData, userId } = data;

    // Start transaction - everything succeeds or everything fails
    const result = await db.transaction(async (tx) => {

      // STEP 1: Validate and deduct inventory atomically
      for (const item of cartItems) {
        if (item.isSimpleProduct && item.product) {
          // Handle simple product
          const [currentProduct] = await tx
            .select({
              inStock: products.inStock,
              name: products.name
            })
            .from(products)
            .where(eq(products.id, item.product.id))
            .for('update') // Lock row to prevent race conditions
            .limit(1);

          if (!currentProduct) {
            throw new Error(`Product "${item.product.name}" not found.`);
          }

          const currentStock = currentProduct.inStock || 0;

          // Check if sufficient stock
          if (currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${currentProduct.name}". Available: ${currentStock}, Requested: ${item.quantity}`
            );
          }

          // Deduct inventory
          await tx
            .update(products)
            .set({
              inStock: sql`${products.inStock} - ${item.quantity}`,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.product.id));

        } else if (!item.isSimpleProduct && item.variant) {
          // Handle configurable product variant
          const [currentVariant] = await tx
            .select({ inStock: productVariants.inStock })
            .from(productVariants)
            .where(eq(productVariants.id, item.variant.id))
            .for('update') // Lock row to prevent race conditions
            .limit(1);

          if (!currentVariant) {
            throw new Error(`Product variant not found.`);
          }

          const currentStock = currentVariant.inStock || 0;
          const variantName = `${item.variant.product.name} (${item.variant.color?.name || ''} ${item.variant.size?.name || ''})`.trim();

          // Check if sufficient stock
          if (currentStock < item.quantity) {
            throw new Error(
              `Insufficient stock for "${variantName}". Available: ${currentStock}, Requested: ${item.quantity}`
            );
          }

          // Deduct inventory
          await tx
            .update(productVariants)
            .set({
              inStock: sql`${productVariants.inStock} - ${item.quantity}`,
            })
            .where(eq(productVariants.id, item.variant.id));
        }
      }

      // STEP 2: Create order record (only after successful inventory deduction)
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          status: 'pending',
          totalAmount: calculation.totalAmount.toString(),
          subtotal: calculation.subtotal.toString(),
          shippingCost: calculation.shippingCost.toString(),
          taxAmount: calculation.taxAmount.toString(),
          shippingAddressId: checkoutData.shippingAddressId || null,
          billingAddressId: checkoutData.useSameAddress
            ? checkoutData.shippingAddressId
            : checkoutData.billingAddressId || null,
          paymentMethod: checkoutData.paymentMethod,
          notes: checkoutData.notes || null,
        })
        .returning({ id: orders.id });

      // STEP 3: Create order items
      const orderItemsData = cartItems.map(item => {
        if (item.isSimpleProduct && item.product) {
          return {
            orderId: newOrder.id,
            productId: item.product.id,
            productVariantId: null,
            isSimpleProduct: true,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.product.price).toString(),
            salePriceAtPurchase: item.product.salePrice ? parseFloat(item.product.salePrice).toString() : null,
          };
        } else if (!item.isSimpleProduct && item.variant) {
          return {
            orderId: newOrder.id,
            productId: item.variant.product.id,
            productVariantId: item.variant.id,
            isSimpleProduct: false,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.variant.price).toString(),
            salePriceAtPurchase: item.variant.salePrice ? parseFloat(item.variant.salePrice).toString() : null,
          };
        }
        return null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      if (orderItemsData.length > 0) {
        await tx.insert(orderItems).values(orderItemsData);
      }

      return newOrder.id;
    });

    // Clear cart after successful order creation
    await clearCart();

    return {
      success: true,
      orderId: result,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create order. Please try again.",
    };
  }
}

// Restore inventory when order is cancelled
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

// Get order by ID with full details - using manual joins instead of Drizzle relations
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

    // Get basic order data
    const orderData = await db
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

    if (!orderData.length) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    const order = orderData[0];

    // Get shipping address
    let shippingAddress = null;
    if (order.shippingAddressId) {
      const shippingAddressData = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.shippingAddressId))
        .limit(1);

      if (shippingAddressData.length) {
        shippingAddress = shippingAddressData[0];
      }
    }

    // Get billing address
    let billingAddress = null;
    if (order.billingAddressId && order.billingAddressId !== order.shippingAddressId) {
      const billingAddressData = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.billingAddressId))
        .limit(1);

      if (billingAddressData.length) {
        billingAddress = billingAddressData[0];
      }
    }

    // Get order items
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

    // Process order items to get related data
    const processedItems = [];

    for (const item of orderItemsData) {
      if (item.isSimpleProduct && item.productId) {
        // Handle simple product
        const productData = await db
          .select({
            id: products.id,
            name: products.name,
            sku: products.sku,
          })
          .from(products)
          .where(eq(products.id, item.productId))
          .limit(1);

        if (productData.length) {
          const product = productData[0];

          // FIXED: Get product images - removed the variantId null filter that was causing empty results
          const imagesData = await db
            .select({
              id: productImages.id,
              url: productImages.url,
              isPrimary: productImages.isPrimary,
            })
            .from(productImages)
            .where(
              and(
                eq(productImages.productId, product.id),
                isNull(productImages.variantId) // Use isNull() instead of eq(null)
              )
            )
            .orderBy(desc(productImages.isPrimary));

          processedItems.push({
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.priceAtPurchase),
            salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
            isSimpleProduct: true,
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku || '',
              images: imagesData.map(img => ({
                id: img.id,
                url: img.url,
                isPrimary: img.isPrimary || false,
              })),
            },
          });
        }
      } else if (!item.isSimpleProduct && item.productVariantId) {
        // Handle configurable product variant
        const variantData = await db
          .select({
            variantId: productVariants.id,
            variantSku: productVariants.sku,
            productId: products.id,
            productName: products.name,
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
          .where(eq(productVariants.id, item.productVariantId))
          .limit(1);

        if (variantData.length) {
          const variant = variantData[0];

          // Get variant images
          const imagesData = await db
            .select({
              id: productImages.id,
              url: productImages.url,
              isPrimary: productImages.isPrimary,
              variantId: productImages.variantId,
            })
            .from(productImages)
            .where(eq(productImages.productId, variant.productId))
            .orderBy(desc(productImages.isPrimary));

          // Filter images for this variant
          const filteredImages = imagesData.filter(img =>
            img.variantId === variant.variantId || img.variantId === null
          );

          processedItems.push({
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
              images: filteredImages.map(img => ({
                id: img.id,
                url: img.url,
                isPrimary: img.isPrimary || false,
              })),
            },
          });
        }
      }
    }

    const result: OrderWithDetails = {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: parseFloat(order.totalAmount),
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shippingCost),
      taxAmount: parseFloat(order.taxAmount),
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      shippingAddress,
      billingAddress,
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

// Get user's orders
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

    // Get basic order data
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

    // Batch fetch all addresses for this user (single query)
    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, user.id));

    const addressMap = new Map(userAddresses.map(addr => [addr.id, addr]));

    // Batch fetch ALL order items for ALL orders (single query)
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

    // Group order items by order ID
    const orderItemsMap = new Map<string, typeof allOrderItems>();
    allOrderItems.forEach(item => {
      if (!orderItemsMap.has(item.orderId)) {
        orderItemsMap.set(item.orderId, []);
      }
      orderItemsMap.get(item.orderId)!.push(item);
    });

    // Collect all unique product and variant IDs
    const productIds = new Set<string>();
    const variantIds = new Set<string>();

    allOrderItems.forEach(item => {
      if (item.productId) productIds.add(item.productId);
      if (item.productVariantId) variantIds.add(item.productVariantId);
    });

    // Batch fetch all products (single query)
    const productsMap = new Map();
    if (productIds.size > 0) {
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
        })
        .from(products)
        .where(inArray(products.id, Array.from(productIds)));

      productsData.forEach(p => productsMap.set(p.id, p));
    }

    // Batch fetch all variants with related data (single query)
    const variantsMap = new Map();
    const variantProductIds = new Set<string>();

    if (variantIds.size > 0) {
      const variantsData = await db
        .select({
          variantId: productVariants.id,
          variantSku: productVariants.sku,
          productId: productVariants.productId,
          productName: products.name,
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

    // Batch fetch all images for all products (single query)
    const imagesMap = new Map<string, Array<any>>();

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

      // Group images by product ID and variant ID
      imagesData.forEach(img => {
        // For variant images
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

        // For product images (variants without specific images or simple products)
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

    // Now process all orders using the cached data
    const processedOrders: OrderWithDetails[] = userOrdersData.map(orderData => {
      // Get addresses from cache
      const shippingAddress = orderData.shippingAddressId
        ? addressMap.get(orderData.shippingAddressId) || null
        : null;

      const billingAddress = orderData.billingAddressId &&
        orderData.billingAddressId !== orderData.shippingAddressId
        ? addressMap.get(orderData.billingAddressId) || null
        : null;

      // Get order items from cache
      const itemsForThisOrder = orderItemsMap.get(orderData.id) || [];

      // Process order items using cached data
      const processedItems = itemsForThisOrder.map(item => {
        if (item.isSimpleProduct && item.productId) {
          const product = productsMap.get(item.productId);
          if (!product) return null;

          const images = imagesMap.get(item.productId) || [];

          return {
            id: item.id,
            quantity: item.quantity,
            priceAtPurchase: parseFloat(item.priceAtPurchase),
            salePriceAtPurchase: item.salePriceAtPurchase ? parseFloat(item.salePriceAtPurchase) : null,
            isSimpleProduct: true,
            product: {
              id: product.id,
              name: product.name,
              sku: product.sku || '',
              images: images.slice(0, 3), // Limit to 3 images for list view
            },
          };
        } else if (!item.isSimpleProduct && item.productVariantId) {
          const variant = variantsMap.get(item.productVariantId);
          if (!variant) return null;

          // Get variant-specific images or fall back to product images
          const variantImages = imagesMap.get(item.productVariantId) || [];
          const productImages = imagesMap.get(variant.productId) || [];
          const images = variantImages.length > 0 ? variantImages : productImages;

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
              images: images.slice(0, 3), // Limit to 3 images for list view
            },
          };
        }
        return null;
      }).filter((item): item is NonNullable<typeof item> => item !== null);

      return {
        id: orderData.id,
        userId: orderData.userId,
        status: orderData.status,
        totalAmount: parseFloat(orderData.totalAmount),
        subtotal: parseFloat(orderData.subtotal),
        shippingCost: parseFloat(orderData.shippingCost),
        taxAmount: parseFloat(orderData.taxAmount),
        paymentMethod: orderData.paymentMethod,
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