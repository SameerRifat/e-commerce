// src/lib/actions/dashboard/dashboard-stats.ts
"use server";

import { db } from "@/lib/db";
import {
    products,
    categories,
    brands,
    orders,
    orderItems,
    users,
    addresses,
} from "@/lib/db/schema";
import { count, sql, desc, eq, gte, and, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";

// Simplified dashboard stats - focused on overview
export interface DashboardStats {
    totalProducts: number;
    totalCategories: number;
    totalBrands: number;
    totalOrders: number;
    activeOrders: number; // pending + processing combined
    todayOrders: number;
    weeklyRevenue: number;
    previousWeekRevenue: number;
    recentProducts: number;
    recentBrands: number;
}

// Recent order type for dashboard
export interface RecentDashboardOrder {
    id: string;
    orderNumber: string;
    customerName: string | null;
    customerEmail: string | null;
    status: 'pending' | 'processing' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
    totalAmount: number;
    itemCount: number;
    createdAt: Date;
    shippingCity: string | null;
}

/**
 * Get simplified dashboard statistics focused on high-level overview
 * Removes redundancy with orders page and focuses on actionable metrics
 */
export async function getDashboardStats(): Promise<{
    success: boolean;
    stats?: DashboardStats;
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Authentication required" };
        }

        // Calculate date ranges
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Execute all queries in parallel for optimal performance
        const [
            productStats,
            categoryCount,
            brandStats,
            orderStats,
            revenueStats,
        ] = await Promise.all([
            // Product statistics with weekly count
            db
                .select({
                    total: count(),
                    recentCount: count(sql`case when ${products.createdAt} >= ${weekAgo} then 1 end`),
                })
                .from(products),

            // Category count
            db
                .select({ count: count() })
                .from(categories),

            // Brand statistics with weekly count
            db
                .select({
                    total: count(),
                    recentCount: count(sql`case when ${brands.id} in (
            select ${products.brandId} 
            from ${products} 
            where ${products.createdAt} >= ${weekAgo}
          ) then 1 end`),
                })
                .from(brands),

            // Order statistics - simplified for dashboard
            db
                .select({
                    total: count(),
                    activeCount: count(sql`case when ${orders.status} IN ('pending', 'processing') then 1 end`),
                    todayCount: count(sql`case when ${orders.createdAt} >= ${today} then 1 end`),
                })
                .from(orders),

            // Revenue statistics with week-over-week comparison
            db
                .select({
                    weeklyRevenue: sql<number>`COALESCE(SUM(
            CASE WHEN ${orders.createdAt} >= ${weekAgo} 
              AND ${orders.status} NOT IN ('cancelled', 'pending')
            THEN CAST(${orders.totalAmount} AS DECIMAL) 
            ELSE 0 END
          ), 0)`,
                    previousWeekRevenue: sql<number>`COALESCE(SUM(
            CASE WHEN ${orders.createdAt} >= ${twoWeeksAgo} 
              AND ${orders.createdAt} < ${weekAgo}
              AND ${orders.status} NOT IN ('cancelled', 'pending')
            THEN CAST(${orders.totalAmount} AS DECIMAL) 
            ELSE 0 END
          ), 0)`,
                })
                .from(orders),
        ]);

        const stats: DashboardStats = {
            totalProducts: productStats[0]?.total ?? 0,
            totalCategories: categoryCount[0]?.count ?? 0,
            totalBrands: brandStats[0]?.total ?? 0,
            totalOrders: orderStats[0]?.total ?? 0,
            activeOrders: orderStats[0]?.activeCount ?? 0,
            todayOrders: orderStats[0]?.todayCount ?? 0,
            weeklyRevenue: Number(revenueStats[0]?.weeklyRevenue ?? 0),
            previousWeekRevenue: Number(revenueStats[0]?.previousWeekRevenue ?? 0),
            recentProducts: productStats[0]?.recentCount ?? 0,
            recentBrands: brandStats[0]?.recentCount ?? 0,
        };

        return {
            success: true,
            stats,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return {
            success: false,
            error: "Failed to fetch dashboard statistics",
        };
    }
}

/**
 * Get recent orders for dashboard with optimized single query approach
 * Fetches orders with all related data in minimal queries
 */
export async function getRecentDashboardOrders(limit: number = 5): Promise<{
    success: boolean;
    orders?: RecentDashboardOrder[];
    error?: string;
}> {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return { success: false, error: "Authentication required" };
        }

        // Fetch recent orders with user and address info in one query
        const ordersData = await db
            .select({
                id: orders.id,
                userId: orders.userId,
                status: orders.status,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
                shippingAddressId: orders.shippingAddressId,
                userName: users.name,
                userEmail: users.email,
                shippingCity: addresses.city,
            })
            .from(orders)
            .leftJoin(users, eq(users.id, orders.userId))
            .leftJoin(addresses, eq(addresses.id, orders.shippingAddressId))
            .orderBy(desc(orders.createdAt))
            .limit(limit);

        if (ordersData.length === 0) {
            return {
                success: true,
                orders: [],
            };
        }

        // Batch fetch item counts for all orders
        const orderIds = ordersData.map(o => o.id);
        const itemCounts = await db
            .select({
                orderId: orderItems.orderId,
                count: sql<number>`cast(count(*) as integer)`,
            })
            .from(orderItems)
            .where(inArray(orderItems.orderId, orderIds))
            .groupBy(orderItems.orderId);

        const itemCountMap = new Map(itemCounts.map(ic => [ic.orderId, ic.count]));

        // Transform to RecentDashboardOrder
        const recentOrders: RecentDashboardOrder[] = ordersData.map(order => ({
            id: order.id,
            orderNumber: order.id.substring(0, 8).toUpperCase(),
            customerName: order.userName || 'Guest',
            customerEmail: order.userEmail,
            status: order.status as RecentDashboardOrder['status'],
            totalAmount: parseFloat(order.totalAmount),
            itemCount: itemCountMap.get(order.id) || 0,
            createdAt: order.createdAt,
            shippingCity: order.shippingCity,
        }));

        return {
            success: true,
            orders: recentOrders,
        };
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return {
            success: false,
            error: "Failed to fetch recent orders",
        };
    }
}