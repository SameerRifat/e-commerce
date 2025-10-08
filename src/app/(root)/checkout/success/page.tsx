// src/app/(root)/checkout/success/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { OrderConfirmation } from '@/components/checkout/order-confirmation';
import { getCurrentUser } from '@/lib/auth/actions';
import { getOrder } from '@/lib/actions/orders';

// Loading component for order confirmation
function OrderConfirmationSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <div className="w-10 h-10 bg-green-400 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-96 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4" />
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
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        We couldn&apos;t find the order you&apos;re looking for. It may have been deleted or you may not have permission to view it.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/profile/orders">
            View All Orders
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

// Access denied component
function AccessDenied() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-orange-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        You don&apos;t have permission to view this order. Please sign in with the correct account.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/sign-in">
            Sign In
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/">
            Go Home
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Error display component
function OrderError({ message }: { message: string }) {
  return (
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
                View All Orders
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Server-side order confirmation content
async function OrderConfirmationContent({ orderId }: { orderId: string }) {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in?returnUrl=/checkout/success?orderId=' + orderId);
  }

  // Get order details
  const orderResult = await getOrder(orderId);
  
  if (!orderResult.success) {
    if (orderResult.error?.includes('not found')) {
      return <OrderNotFound />;
    }
    if (orderResult.error?.includes('Authentication')) {
      return <AccessDenied />;
    }
    
    return <OrderError message={orderResult.error || 'Failed to load order details. Please try again.'} />;
  }

  return <OrderConfirmation order={orderResult.order!} />;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  // Await searchParams before accessing its properties
  const params = await searchParams;
  const orderId = params.orderId;

  if (!orderId) {
    return (
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-pink-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Order ID Provided</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            We couldn&apos;t find the order you&apos;re looking for. Please check the URL or go back to your orders.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/profile/orders">
                View All Orders
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <span className="mx-2">•</span>
        <Link href="/checkout" className="hover:text-gray-900 transition-colors">
          Checkout
        </Link>
        <span className="mx-2">•</span>
        <span className="text-gray-900">Order Confirmation</span>
      </nav>

      {/* Order Confirmation Content */}
      <Suspense fallback={<OrderConfirmationSkeleton />}>
        <OrderConfirmationContent orderId={orderId} />
      </Suspense>
    </main>
  );
}

export const metadata = {
  title: "Order Confirmation | Cosmetics Store",
  description: "Your order has been confirmed. Thank you for shopping with us!",
};