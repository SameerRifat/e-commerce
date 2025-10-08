import Link from "next/link";
import { Suspense } from "react";
import { getCart } from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth/actions";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartPageClient } from "@/components/cart/CartPageClient";

// Loading component for cart items
function CartItemsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-6 border rounded-lg bg-card">
          <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-md animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="flex items-center gap-2 mt-4">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-20" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
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
        Discover our beautiful collection of cosmetics and add some items to your cart.
      </p>
      <Button asChild size="lg">
        <Link href="/products">
          Continue Shopping
        </Link>
      </Button>
    </div>
  );
}

// Server-side cart content
async function CartContent() {
  const [cartData, user] = await Promise.all([
    getCart(),
    getCurrentUser(),
  ]);

  if (cartData.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <CartPageClient
      initialItems={cartData.items} 
      initialTotal={cartData.total}
      user={user}
    />
  );
}

export default async function CartPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900 transition-colors">
          Home
        </Link>
        <span className="mx-2">•</span>
        <span className="text-gray-900">Shopping Cart</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
        <p className="text-gray-600">
          Review your selected items and proceed to checkout when ready.
        </p>
      </div>

      {/* Cart Content */}
      <Suspense fallback={
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <CartItemsSkeleton />
          </div>
          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6 bg-card">
              <div className="h-6 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
              <div className="h-12 bg-gray-200 rounded animate-pulse mt-6" />
            </div>
          </div>
        </div>
      }>
        <CartContent />
      </Suspense>
    </main>
  );
}

export const metadata = {
  title: "Shopping Cart | Cosmetics Store",
  description: "Review your selected cosmetics and beauty products before checkout.",
};
