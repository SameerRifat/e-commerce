// src/lib/actions/dashboard/orders.ts
"use server";

import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants, addresses, users, productImages, colors, sizes } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, like, or, sql, count, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { revalidatePath } from "next/cache";
import type { OrderWithDetails } from "@/lib/actions/orders";

// Dashboard-specific order type with user info
export interface DashboardOrder {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  totalAmount: number;
  paymentMethod: string;
  itemCount: number;
  createdAt: Date;
  shippingAddress?: {
    fullName: string;
    city: string;
    phone: string | null;
  } | null;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
}

// Helper function to restore inventory when order is cancelled
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
    throw error; // Re-throw to prevent status update if inventory restoration fails
  }
}

// Get single order by ID (admin - no user restriction)
export async function getDashboardOrder(orderId: string): Promise<{
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

    // TODO: Add admin role check here
    // if (user.role !== 'admin') {
    //   return { success: false, error: "Unauthorized" };
    // }

    // Get basic order data (NO user restriction for admin)
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
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!orderData.length) {
      return {
        success: false,
        error: "Order not found.",
      };
    }

    const order = orderData[0];

    // Get order items first to know what we need to fetch
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

    // Collect IDs for batch queries
    const productIds = orderItemsData
      .map(item => item.productId)
      .filter((id): id is string => id !== null);
    
    const variantIds = orderItemsData
      .map(item => item.productVariantId)
      .filter((id): id is string => id !== null);

    // Batch fetch all products
    const productsMap = new Map();
    if (productIds.length > 0) {
      const productsData = await db
        .select({
          id: products.id,
          name: products.name,
          sku: products.sku,
        })
        .from(products)
        .where(inArray(products.id, productIds));

      productsData.forEach(p => productsMap.set(p.id, p));
    }

    // Batch fetch all variants with their related data
    const variantsMap = new Map();
    if (variantIds.length > 0) {
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
        .where(inArray(productVariants.id, variantIds));

      variantsData.forEach(v => variantsMap.set(v.variantId, v));
      
      // Add product IDs from variants for image fetching
      variantsData.forEach(v => {
        if (!productsMap.has(v.productId)) {
          productsMap.set(v.productId, { id: v.productId, name: v.productName });
        }
      });
    }

    // Batch fetch all images for all products
    const allProductIds = Array.from(productsMap.keys());
    const imagesMap = new Map<string, Array<any>>();
    
    if (allProductIds.length > 0) {
      const imagesData = await db
        .select({
          id: productImages.id,
          url: productImages.url,
          isPrimary: productImages.isPrimary,
          productId: productImages.productId,
          variantId: productImages.variantId,
        })
        .from(productImages)
        .where(inArray(productImages.productId, allProductIds))
        .orderBy(desc(productImages.isPrimary));

      // Group images by product ID and variant ID
      imagesData.forEach(img => {
        const key = img.variantId || img.productId;
        if (!imagesMap.has(key)) {
          imagesMap.set(key, []);
        }
        imagesMap.get(key)!.push({
          id: img.id,
          url: img.url,
          isPrimary: img.isPrimary || false,
        });
      });
    }

    // Batch fetch addresses
    const addressIds = [order.shippingAddressId, order.billingAddressId].filter(Boolean) as string[];
    const addressesMap = new Map();
    
    if (addressIds.length > 0) {
      const addressesData = await db
        .select()
        .from(addresses)
        .where(inArray(addresses.id, addressIds));

      addressesData.forEach(addr => addressesMap.set(addr.id, addr));
    }

    // Process order items using cached data
    const processedItems = orderItemsData.map(item => {
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
            images,
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
            images,
          },
        };
      }
      return null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

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
      shippingAddress: order.shippingAddressId ? addressesMap.get(order.shippingAddressId) || null : null,
      billingAddress: order.billingAddressId ? addressesMap.get(order.billingAddressId) || null : null,
      items: processedItems,
    };

    return {
      success: true,
      order: result,
    };
  } catch (error) {
    console.error("Error fetching dashboard order:", error);
    return {
      success: false,
      error: "Failed to fetch order details.",
    };
  }
}

// Get all orders with filters (admin only)
export async function getDashboardOrders(filters: OrderFilters = {}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // TODO: Add admin role check
    // if (user.role !== 'admin') {
    //   return { success: false, error: "Unauthorized" };
    // }

    const {
      status,
      search,
      dateFrom,
      dateTo,
      paymentMethod,
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (status && status !== 'all') {
      conditions.push(eq(orders.status, status as any));
    }

    if (dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, endDate));
    }

    if (paymentMethod && paymentMethod !== 'all') {
      conditions.push(eq(orders.paymentMethod, paymentMethod));
    }

    // Get orders with user and address info
    const ordersQuery = db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        createdAt: orders.createdAt,
        shippingAddressId: orders.shippingAddressId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const ordersData = await ordersQuery;

    // Get order items count for each order (optimized with single query)
    const orderIds = ordersData.map(o => o.id);
    
    let itemCountMap = new Map<string, number>();
    
    if (orderIds.length > 0) {
      const itemCounts = await db
        .select({
          orderId: orderItems.orderId,
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds))
        .groupBy(orderItems.orderId);

      itemCountMap = new Map(itemCounts.map(ic => [ic.orderId, ic.count]));
    }

    // Get shipping addresses (optimized batch query)
    const addressIds = ordersData
      .map(o => o.shippingAddressId)
      .filter(Boolean) as string[];
    
    let addressMap = new Map();
    
    if (addressIds.length > 0) {
      const addressesData = await db
        .select({
          id: addresses.id,
          fullName: addresses.fullName,
          city: addresses.city,
          phone: addresses.phone,
        })
        .from(addresses)
        .where(inArray(addresses.id, addressIds));

      addressMap = new Map(addressesData.map(a => [a.id, a]));
    }

    // Process orders
    const processedOrders: DashboardOrder[] = ordersData.map(order => {
      const address = order.shippingAddressId ? addressMap.get(order.shippingAddressId) : null;
      
      return {
        id: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        userId: order.userId,
        customerName: order.userName || address?.fullName || 'Guest',
        customerEmail: order.userEmail,
        status: order.status,
        totalAmount: parseFloat(order.totalAmount),
        paymentMethod: order.paymentMethod,
        itemCount: itemCountMap.get(order.id) || 0,
        createdAt: order.createdAt,
        shippingAddress: address ? {
          fullName: address.fullName,
          city: address.city,
          phone: address.phone,
        } : null,
      };
    });

    // Get total count
    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = totalResult?.count || 0;

    // Apply search filter on processed orders if needed
    let filteredOrders = processedOrders;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = processedOrders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customerName?.toLowerCase().includes(searchLower) ||
        order.customerEmail?.toLowerCase().includes(searchLower)
      );
    }

    return {
      success: true,
      orders: filteredOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
    };
  }
}

// Get order statistics
export async function getOrderStats(): Promise<{ success: boolean; stats?: OrderStats; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all stats in parallel
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
      todayOrders,
    ] = await Promise.all([
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'pending')),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'processing')),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'shipped')),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'delivered')),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(eq(orders.status, 'cancelled')),
      db.select({ total: sql<number>`cast(sum(cast(total_amount as numeric)) as numeric)` })
        .from(orders)
        .where(eq(orders.status, 'delivered')),
      db.select({ count: sql<number>`cast(count(*) as integer)` }).from(orders).where(gte(orders.createdAt, today)),
    ]);

    const stats: OrderStats = {
      totalOrders: totalOrders[0]?.count || 0,
      pendingOrders: pendingOrders[0]?.count || 0,
      processingOrders: processingOrders[0]?.count || 0,
      shippedOrders: shippedOrders[0]?.count || 0,
      deliveredOrders: deliveredOrders[0]?.count || 0,
      cancelledOrders: cancelledOrders[0]?.count || 0,
      totalRevenue: parseFloat(revenueResult[0]?.total || '0'),
      todayOrders: todayOrders[0]?.count || 0,
    };

    return { success: true, stats };
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return { success: false, error: "Failed to fetch order statistics" };
  }
}

// Update order status (admin only) with business rules validation and inventory restoration
export async function updateDashboardOrderStatus(
  orderId: string,
  newStatus: 'pending' | 'processing' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Get current order status
    const [currentOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!currentOrder) {
      return { success: false, error: "Order not found" };
    }

    // Business rule validation
    const validationResult = validateStatusTransition(currentOrder.status, newStatus);
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    // INVENTORY MANAGEMENT: Restore inventory when cancelling
    if (newStatus === 'cancelled' && currentOrder.status !== 'cancelled') {
      try {
        await restoreInventory(orderId);
      } catch (error) {
        console.error("Failed to restore inventory:", error);
        return { 
          success: false, 
          error: "Failed to restore inventory. Order cancellation aborted." 
        };
      }
    }

    // Update order status
    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning({ id: orders.id, status: orders.status });

    if (!updatedOrder) {
      return { success: false, error: "Order not found" };
    }

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${orderId}`);

    return {
      success: true,
      message: `Order status updated to ${newStatus}`,
      order: updatedOrder,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { success: false, error: "Failed to update order status" };
  }
}

// Validate status transition based on business rules
function validateStatusTransition(
  currentStatus: string,
  newStatus: string
): { isValid: boolean; error?: string } {
  // Rule 1: Cancelled orders are immutable (terminal state)
  if (currentStatus === 'cancelled') {
    return {
      isValid: false,
      error: "Cannot modify a cancelled order. Cancelled orders are final.",
    };
  }

  // Rule 2: Delivered orders are immutable (terminal state)
  if (currentStatus === 'delivered') {
    return {
      isValid: false,
      error: "Cannot modify a delivered order. Order has been completed.",
    };
  }

  // Rule 3: Same status is pointless but allowed
  if (currentStatus === newStatus) {
    return { isValid: true };
  }

  // Rule 4: Can always cancel non-delivered orders
  if (newStatus === 'cancelled') {
    return { isValid: true };
  }

  // Define allowed status progressions
  const statusHierarchy: Record<string, number> = {
    pending: 1,
    processing: 2,
    paid: 2, // Same level as processing (payment can happen at different times)
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: 99, // Terminal state
  };

  const currentLevel = statusHierarchy[currentStatus];
  const newLevel = statusHierarchy[newStatus];

  // Rule 5: Allow limited backwards transitions for logistics issues
  const allowedBackwardTransitions: Record<string, string[]> = {
    out_for_delivery: ['shipped'], // Failed delivery
    shipped: ['processing', 'paid'], // Returned by courier
  };

  // Check if this is an allowed backward transition
  if (newLevel < currentLevel) {
    const allowedPrevious = allowedBackwardTransitions[currentStatus] || [];
    if (allowedPrevious.includes(newStatus)) {
      return { isValid: true };
    }
    
    return {
      isValid: false,
      error: `Cannot revert from ${currentStatus} to ${newStatus}. Orders generally move forward in the fulfillment process.`,
    };
  }

  // Rule 6: Don't skip too many stages (prevent accidents)
  if (newLevel - currentLevel > 2) {
    return {
      isValid: false,
      error: `Cannot skip directly from ${currentStatus} to ${newStatus}. Please update status progressively.`,
    };
  }

  // All validation passed
  return { isValid: true };
}

// Bulk update order statuses
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: 'pending' | 'processing' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled'
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    if (orderIds.length === 0) {
      return { success: false, error: "No orders selected" };
    }

    // If cancelling orders, restore inventory for each
    if (newStatus === 'cancelled') {
      for (const orderId of orderIds) {
        const [currentOrder] = await db
          .select({ status: orders.status })
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        // Only restore inventory if order wasn't already cancelled
        if (currentOrder && currentOrder.status !== 'cancelled') {
          try {
            await restoreInventory(orderId);
          } catch (error) {
            console.error(`Failed to restore inventory for order ${orderId}:`, error);
            // Continue with other orders, but log the error
          }
        }
      }
    }

    await db
      .update(orders)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(inArray(orders.id, orderIds));

    revalidatePath("/dashboard/orders");

    return {
      success: true,
      message: `${orderIds.length} orders updated to ${newStatus}`,
    };
  } catch (error) {
    console.error("Error bulk updating orders:", error);
    return { success: false, error: "Failed to update orders" };
  }
}

// Delete order (admin only - use with caution)
export async function deleteOrder(orderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // Check if order exists and is cancellable
    const [order] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Only allow deletion of cancelled orders
    if (order.status !== 'cancelled') {
      return {
        success: false,
        error: "Only cancelled orders can be deleted. Cancel the order first.",
      };
    }

    // Note: Inventory was already restored when order was cancelled
    // Delete order (order items will cascade delete)
    await db.delete(orders).where(eq(orders.id, orderId));

    revalidatePath("/dashboard/orders");

    return {
      success: true,
      message: "Order deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { success: false, error: "Failed to delete order" };
  }
}