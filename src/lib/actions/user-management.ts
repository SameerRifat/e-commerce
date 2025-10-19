// src/lib/actions/user-management.ts
"use server";

import { db } from "@/lib/db";
import { users, orders, type SelectUser } from "@/lib/db/schema";
import { eq, asc, desc, ilike, or, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkIsAdmin } from "@/lib/auth/actions";

// Types for server action responses
export type ActionResult<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    fieldErrors?: Record<string, string[]>;
};

// Enhanced user type with order statistics
export interface UserWithStats extends SelectUser {
    orderCount: number;
    totalSpent: number;
}

// Pagination and search parameters
export interface UserSearchParams {
    search?: string;
    role?: "all" | "user" | "admin";
    emailVerified?: "all" | "verified" | "unverified";
    page?: number;
    limit?: number;
    sortBy?: "name" | "email" | "role" | "createdAt" | "orderCount" | "totalSpent";
    sortOrder?: "asc" | "desc";
}

export interface PaginatedUsers {
    users: UserWithStats[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Single optimized query for users with search, pagination, and stats using window function
export async function getUsers(params: UserSearchParams = {}): Promise<PaginatedUsers> {
    try {
        // Check if user is admin
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
            throw new Error("Unauthorized: Admin access required");
        }

        const {
            search = "",
            role = "all",
            emailVerified = "all",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = params;

        // Ensure valid page and limit values
        const validPage = Math.max(1, page);
        const validLimit = Math.max(1, Math.min(limit, 100)); // Cap at 100
        const offset = (validPage - 1) * validLimit;

        // Build search conditions
        const conditions = [];

        if (search) {
            conditions.push(
                or(
                    ilike(users.name, `%${search}%`),
                    ilike(users.email, `%${search}%`)
                )
            );
        }

        if (role !== "all") {
            conditions.push(eq(users.role, role));
        }

        if (emailVerified === "verified") {
            conditions.push(eq(users.emailVerified, true));
        } else if (emailVerified === "unverified") {
            conditions.push(eq(users.emailVerified, false));
        }

        const searchCondition = conditions.length > 0 ? and(...conditions) : undefined;

        // Build sort condition
        const getSortColumn = () => {
            switch (sortBy) {
                case "orderCount":
                    return sql`order_count`;
                case "totalSpent":
                    return sql`total_spent`;
                case "name":
                    return users.name;
                case "email":
                    return users.email;
                case "role":
                    return users.role;
                case "createdAt":
                    return users.createdAt;
                default:
                    return users.createdAt;
            }
        };

        const sortColumn = getSortColumn();
        const orderDirection = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn);

        // Single query with window function for total count
        const usersResult = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                image: users.image,
                role: users.role,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                orderCount: sql<number>`cast(coalesce(count(distinct ${orders.id}), 0) as integer)`.as('order_count'),
                totalSpent: sql<number>`cast(coalesce(sum(${orders.totalAmount}), 0) as numeric)`.as('total_spent'),
                // Window function to get total count without separate query
                totalCount: sql<number>`cast(count(*) over() as integer)`.as('total_count'),
            })
            .from(users)
            .leftJoin(orders, eq(users.id, orders.userId))
            .where(searchCondition)
            .groupBy(
                users.id,
                users.name,
                users.email,
                users.emailVerified,
                users.image,
                users.role,
                users.createdAt,
                users.updatedAt
            )
            .orderBy(orderDirection)
            .limit(validLimit)
            .offset(offset);

        // Handle edge case when offset is too high (no results returned)
        let total = 0;
        if (usersResult.length > 0) {
            total = usersResult[0].totalCount;
        } else if (validPage > 1) {
            // If no results but we're not on page 1, get total count separately
            const countResult = await db
                .select({
                    total: sql<number>`cast(count(distinct ${users.id}) as integer)`,
                })
                .from(users)
                .where(searchCondition);

            total = countResult[0]?.total || 0;
        }

        const totalPages = Math.ceil(total / validLimit);

        return {
            users: usersResult.map(({ totalCount: _, ...user }) => ({
                ...user,
                orderCount: Number(user.orderCount),
                totalSpent: Number(user.totalSpent),
            })),
            pagination: {
                page: validPage,
                limit: validLimit,
                total,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        return {
            users: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        };
    }
}

// Get single user with stats
export async function getUserById(userId: string): Promise<ActionResult<UserWithStats>> {
    try {
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        const result = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                emailVerified: users.emailVerified,
                image: users.image,
                role: users.role,
                createdAt: users.createdAt,
                updatedAt: users.updatedAt,
                orderCount: sql<number>`cast(coalesce(count(distinct ${orders.id}), 0) as integer)`,
                totalSpent: sql<number>`cast(coalesce(sum(${orders.totalAmount}), 0) as numeric)`,
            })
            .from(users)
            .leftJoin(orders, eq(users.id, orders.userId))
            .where(eq(users.id, userId))
            .groupBy(
                users.id,
                users.name,
                users.email,
                users.emailVerified,
                users.image,
                users.role,
                users.createdAt,
                users.updatedAt
            )
            .limit(1);

        if (!result || result.length === 0) {
            return { success: false, error: "User not found" };
        }

        const user = {
            ...result[0],
            orderCount: Number(result[0].orderCount),
            totalSpent: Number(result[0].totalSpent),
        };

        return { success: true, data: user };
    } catch (error) {
        console.error("Error fetching user:", error);
        return { success: false, error: "Failed to fetch user" };
    }
}

// Update user role
const updateRoleSchema = z.object({
    userId: z.string().uuid(),
    role: z.enum(["user", "admin"]),
});

export async function updateUserRole(
    userId: string,
    role: "user" | "admin"
): Promise<ActionResult> {
    try {
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        // Validate input
        const validation = updateRoleSchema.safeParse({ userId, role });
        if (!validation.success) {
            return {
                success: false,
                error: "Invalid input",
                fieldErrors: validation.error.flatten().fieldErrors as Record<string, string[]>,
            };
        }

        // Update user role
        await db
            .update(users)
            .set({
                role,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error: "Failed to update user role" };
    }
}

// Delete user (soft delete - can be extended to hard delete if needed)
export async function deleteUser(userId: string): Promise<ActionResult> {
    try {
        const isAdmin = await checkIsAdmin();
        if (!isAdmin) {
            return { success: false, error: "Unauthorized: Admin access required" };
        }

        // Check if user has orders
        const userOrders = await db
            .select({ count: sql<number>`cast(count(*) as integer)` })
            .from(orders)
            .where(eq(orders.userId, userId));

        if (userOrders[0]?.count > 0) {
            return {
                success: false,
                error: "Cannot delete user with existing orders. Please archive or reassign orders first.",
            };
        }

        // Delete user
        await db.delete(users).where(eq(users.id, userId));

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}