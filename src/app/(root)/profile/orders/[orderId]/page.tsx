// src/app/(root)/profile/orders/[orderId]/page.tsx

import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/actions';
import { getOrder } from '@/lib/actions/orders';
import { OrderDetailClient } from '@/components/profile/orders/order-detail-client';

// Loading component for order detail
function OrderDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-96 mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Right Column Skeleton */}
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="p-4">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-3" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order not found component
function OrderNotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-6">
        <Package className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        We couldn&apos;t find the order you&apos;re looking for. It may have been deleted or you may not have permission to view it.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/profile/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Error display component
function OrderError({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Order</h3>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/profile/orders">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Server-side order detail content
async function OrderDetailContent({ orderId }: { orderId: string }) {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in?returnUrl=/profile/orders/' + orderId);
  }

  // Get order details
  const orderResult = await getOrder(orderId);
  
  if (!orderResult.success) {
    if (orderResult.error?.includes('not found')) {
      return <OrderNotFound />;
    }
    
    return <OrderError message={orderResult.error || 'Failed to load order details. Please try again.'} />;
  }

  if (!orderResult.order) {
    return <OrderNotFound />;
  }

  return <OrderDetailClient order={orderResult.order} />;
}

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;

  // Basic validation of orderId
  if (!orderId || typeof orderId !== 'string') {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <span className="mx-2">•</span>
        <Link href="/profile" className="hover:text-gray-900 transition-colors">
          Profile
        </Link>
        <span className="mx-2">•</span>
        <Link href="/profile/orders" className="hover:text-gray-900 transition-colors">
          Orders
        </Link>
        <span className="mx-2">•</span>
        <span className="text-gray-900">Order Details</span>
      </nav>

      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/profile/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>

      {/* Order Detail Content */}
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderDetailContent orderId={orderId} />
      </Suspense>
    </main>
  );
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  
  return {
    title: `Order Details | Cosmetics Store`,
    description: `View detailed information about your order #${orderId.substring(0, 8).toUpperCase()}`,
  };
}