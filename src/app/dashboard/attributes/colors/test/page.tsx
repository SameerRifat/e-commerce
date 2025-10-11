// TEMPORARY TEST FILE: src/app/dashboard/attributes/colors/test/page.tsx
// Create this as a test to isolate the issue

import React from "react";
import { getColors } from "@/lib/actions/color-management";
import DashboardPagination from "@/components/dashboard/products/DashboardPagination";

interface TestColorsPageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
    }>;
}

function getNumberParam(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

export default async function TestColorsPage({ searchParams }: TestColorsPageProps) {
    const params = await searchParams;

    const page = getNumberParam(params.page, 1);
    const limit = getNumberParam(params.limit, 2);

    const { colors, pagination } = await getColors({
        page,
        limit,
        sortBy: "name",
        sortOrder: "asc",
    });

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Colors Pagination Test</h1>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                <p><strong>Current Page:</strong> {page}</p>
                <p><strong>Limit:</strong> {limit}</p>
                <p><strong>Total Colors:</strong> {pagination.total}</p>
                <p><strong>Total Pages:</strong> {pagination.totalPages}</p>
            </div>

            <div className="border rounded p-4">
                <h2 className="font-semibold mb-4">Colors on this page:</h2>
                <div className="space-y-2">
                    {colors.map((color) => (
                        <div key={color.id} className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: color.hexCode }}
                            />
                            <span>{color.name}</span>
                            <span className="text-gray-500">({color.slug})</span>
                        </div>
                    ))}
                </div>
            </div>

            <DashboardPagination
                currentPage={pagination.page}
                totalCount={pagination.total}
                pageSize={limit}
                className="mt-8"
            />
        </div>
    );
}