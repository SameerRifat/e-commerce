// src/app/(dashboard)/dashboard/orders/[orderId]/page.tsx

import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentUser } from '@/lib/auth/actions';
import { getDashboardOrder } from '@/lib/actions/dashboard/orders'; // CHANGED: Use dashboard-specific function
import { DashboardOrderDetail } from '@/components/dashboard/orders/dashboard-order-detail';

function OrderDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
}

async function OrderDetailContent({ orderId }: { orderId: string }) {
    const user = await getCurrentUser();
    if (!user) {
        redirect('/sign-in?returnUrl=/dashboard/orders/' + orderId);
    }

    // TODO: Add admin role check
    // if (user.role !== 'admin') {
    //     redirect('/');
    // }

    // CHANGED: Use getDashboardOrder instead of getOrder
    const orderResult = await getDashboardOrder(orderId);

    if (!orderResult.success || !orderResult.order) {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                <p className="text-muted-foreground mb-6">
                    {orderResult.error || 'The order you are looking for does not exist.'}
                </p>
                <Button asChild>
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Orders
                    </Link>
                </Button>
            </div>
        );
    }

    return <DashboardOrderDetail order={orderResult.order} />;
}

interface OrderDetailPageProps {
    params: Promise<{ orderId: string }>;
}

export default async function DashboardOrderDetailPage({ params }: OrderDetailPageProps) {
    const { orderId } = await params;

    if (!orderId || typeof orderId !== 'string') {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/orders">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Order Details</h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage order information
                    </p>
                </div>
            </div>

            <Suspense fallback={<OrderDetailSkeleton />}>
                <OrderDetailContent orderId={orderId} />
            </Suspense>
        </div>
    );
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
    const { orderId } = await params;

    return {
        title: `Order #${orderId.substring(0, 8).toUpperCase()} | Dashboard`,
        description: 'View order details',
    };
}