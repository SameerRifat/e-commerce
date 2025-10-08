// src/app/(dashboard)/dashboard/orders/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/actions';
import { getDashboardOrders, getOrderStats } from '@/lib/actions/dashboard/orders';
import { Skeleton } from '@/components/ui/skeleton';
import { OrdersStats } from '@/components/dashboard/orders/orders-stats';
import { OrdersTable } from '@/components/dashboard/orders/orders-table';
import { OrdersFilters } from '@/components/dashboard/orders/orders-filters';

// Loading skeletons
function StatsLoading() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[120px] mb-2" />
                        <Skeleton className="h-3 w-[150px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function TableLoading() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

interface OrdersPageProps {
    searchParams: Promise<{
        status?: string;
        search?: string;
        dateFrom?: string;
        dateTo?: string;
        paymentMethod?: string;
        page?: string;
    }>;
}

async function OrdersContent({ searchParams }: OrdersPageProps) {
    const params = await searchParams;

    const filters = {
        status: params.status,
        search: params.search,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        paymentMethod: params.paymentMethod,
        page: params.page ? parseInt(params.page) : 1,
    };

    const [ordersResult, statsResult] = await Promise.all([
        getDashboardOrders(filters),
        getOrderStats(),
    ]);

    if (!ordersResult.success) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Failed to load orders</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {statsResult.success && statsResult.stats && (
                <OrdersStats stats={statsResult.stats} />
            )}

            <OrdersFilters />

            <OrdersTable
                orders={ordersResult.orders || []}
                pagination={ordersResult.pagination}
            />
        </>
    );
}

export default async function DashboardOrdersPage({ searchParams }: OrdersPageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/sign-in?returnUrl=/dashboard/orders');
    }

    // TODO: Check if user is admin
    // if (user.role !== 'admin') {
    //   redirect('/');
    // }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
                <p className="text-muted-foreground mt-2">
                    Manage and track all customer orders
                </p>
            </div>

            <Suspense fallback={<StatsLoading />}>
                <OrdersContent searchParams={searchParams} />
            </Suspense>
        </div>
    );
}

export const metadata = {
    title: "Orders | Dashboard",
    description: "Manage customer orders",
};