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

// Loading component for order detail - FIXED FOR MOBILE
function OrderDetailSkeleton() {
  return (
    <div className="w-[93%] max-w-[95rem] mx-auto lg:w-full space-y-4 sm:space-y-6">
      {/* Header Skeleton - FIXED */}
      <div className="p-4 sm:p-6 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse" />
        <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-48 sm:w-64 mx-auto mb-3 sm:mb-4 max-w-full" />
        <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-full sm:w-96 mx-auto mb-3 sm:mb-4 max-w-full px-4" />
        <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-24 sm:w-32 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column Skeleton - FIXED */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="p-4 sm:p-6">
                <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse w-36 sm:w-48 mb-3 sm:mb-4" />
                <div className="space-y-3 sm:space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-full sm:w-3/4" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3 sm:w-1/2" />
                      </div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-16 sm:w-20 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Right Column Skeleton - FIXED */}
        <div className="space-y-4 sm:space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="p-3 sm:p-4">
                <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-24 sm:w-32 mb-2 sm:mb-3" />
                <div className="space-y-2">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Order not found component - FIXED
function OrderNotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center py-12 sm:py-16 px-4">
      <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <Package className="w-10 h-10 sm:w-12 sm:h-12 text-red-500" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
        We couldn&apos;t find the order you&apos;re looking for. It may have been deleted or you may not have permission to view it.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/profile/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg" className="w-full sm:w-auto">
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Error display component - FIXED
function OrderError({ message }: { message: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-12 sm:py-16 px-4">
      <Card>
        <CardContent>
          <div className="text-center py-6 sm:py-8">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Error Loading Order</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button asChild className="w-full sm:w-auto">
                <Link href="/profile/orders">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full sm:w-auto">
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
    <main className="w-[93%] max-w-[95rem] mx-auto lg:w-full">
      {/* Back Button - FIXED */}
      <div className="mb-4 sm:mb-6">
        <Button variant="ghost" asChild size="sm" className="sm:size-default -ml-2 sm:ml-0">
          <Link href="/profile/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm sm:text-base">Back to Orders</span>
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