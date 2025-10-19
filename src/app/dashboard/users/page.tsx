// src/app/dashboard/users/page.tsx
import React from "react";
import { getUsers } from "@/lib/actions/user-management";
import ToastHandler from "@/components/dashboard/attributes/toast-handler";
import DashboardPagination from "@/components/dashboard/dashboard-pagination";
import UsersClientWrapper from "@/components/dashboard/users/users-client-wrapper";

interface UsersPageProps {
    searchParams: Promise<{
        search?: string;
        role?: "all" | "user" | "admin";
        emailVerified?: "all" | "verified" | "unverified";
        page?: string;
        limit?: string;
        sortBy?: "name" | "email" | "role" | "createdAt" | "orderCount" | "totalSpent";
        sortOrder?: "asc" | "desc";
        success?: string;
    }>;
}

// Helper function to safely get number parameter
function getNumberParam(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const params = await searchParams;

    // Parse parameters with defaults
    const search = params.search || "";
    const role = params.role || "all";
    const emailVerified = params.emailVerified || "all";
    const page = getNumberParam(params.page, 1);
    const limit = getNumberParam(params.limit, 10);
    const sortBy = params.sortBy || "createdAt";
    const sortOrder = params.sortOrder || "desc";

    // Server-side data fetching based on URL parameters
    const { users, pagination } = await getUsers({
        search,
        role,
        emailVerified,
        page,
        limit,
        sortBy,
        sortOrder,
    });

    return (
        <div className="space-y-6">
            {/* Toast handler for success messages */}
            <ToastHandler success={params.success} />

            {/* Client wrapper handles modals and filters while server provides data */}
            <UsersClientWrapper
                initialUsers={users}
                currentFilters={{
                    role,
                    emailVerified,
                    sortBy,
                    sortOrder,
                }}
            />

            {/* Pagination component */}
            <DashboardPagination
                currentPage={pagination.page}
                totalCount={pagination.total}
                pageSize={limit}
                className="mt-8"
            />
        </div>
    );
}