// src/app/(root)/checkout/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { getCurrentUser } from '@/lib/auth/actions';
import { getCart } from '@/lib/actions/cart';
import { getUserAddresses } from '@/lib/actions/address-management';
import { createCheckoutSession } from '@/lib/actions/checkout';
import { calculateOrderTotals } from '@/lib/utils/order-helpers';

// Loading component for checkout
function CheckoutSkeleton() {
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <ShoppingBag className="w-10 h-10 text-pink-400" />
        </div>
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mx-auto mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-96 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-12 bg-gray-200 rounded animate-pulse w-full mt-6" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Empty cart component
function EmptyCart() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12 text-pink-400" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        You need to add items to your cart before proceeding to checkout.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
        <Button variant="outline" asChild size="lg">
          <Link href="/cart">
            View Cart
          </Link>
        </Button>
      </div>
    </div>
  );
}

// No addresses component
function NoAddresses() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Address Required</h3>
          <p className="text-gray-600 mb-6">
            You need to add a shipping address before you can checkout. Please add at least one address to continue.
          </p>
          <Button asChild>
            <Link href="/profile/addresses">
              Add Address
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Server-side checkout content
async function CheckoutContent() {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/sign-in?returnUrl=/checkout');
  }

  // Get cart data
  const cartData = await getCart();
  if (!cartData.items.length) {
    return <EmptyCart />;
  }

  // Get user addresses
  const userAddresses = await getUserAddresses();
  if (!userAddresses.length) {
    return <NoAddresses />;
  }

  // Calculate order totals
  const calculation = calculateOrderTotals(cartData.items);

  // Create checkout session
  const sessionResult = await createCheckoutSession();
  if (!sessionResult.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Checkout Error</h3>
            <p className="text-gray-600 mb-6">
              {sessionResult.error || 'Failed to initialize checkout. Please try again.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/cart">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <CheckoutForm
      initialSession={sessionResult.session}
      cartItems={cartData.items}
      calculation={calculation}
      userAddresses={userAddresses}
    />
  );
}

export default async function CheckoutPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <span className="mx-2">•</span>
        <Link href="/cart" className="hover:text-gray-900 transition-colors">
          Cart
        </Link>
        <span className="mx-2">•</span>
        <span className="text-gray-900">Checkout</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">
          Complete your order by providing your shipping and payment information.
        </p>
      </div>

      {/* Checkout Content */}
      <Suspense fallback={<CheckoutSkeleton />}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

export const metadata = {
  title: "Checkout | Cosmetics Store",
  description: "Complete your order with secure checkout. Choose your shipping address and payment method.",
};
