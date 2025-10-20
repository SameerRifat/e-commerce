// src/app/(root)/cart/page.tsx
import Link from "next/link";
import { Suspense } from "react";
import { getCart } from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth/actions";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartPageClient } from "@/components/cart/CartPageClient";
import PageHeader from "@/components/shared/page-header";
import { PageBreadcrumb } from "@/components/shared/page-breadcrumb";

// Loading component for cart items - FIXED FOR MOBILE
function CartItemsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3 sm:gap-4 p-4 sm:p-6 border rounded-lg bg-card">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-md animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-full sm:w-3/4" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-3/4 sm:w-1/2" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-1/2 sm:w-1/4" />
            <div className="flex items-center gap-2 mt-3 sm:mt-4">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="text-right space-y-2 flex-shrink-0">
            <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-16 sm:w-20" />
            <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-12 sm:w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Empty cart component - FIXED FOR MOBILE
function EmptyCart() {
  return (
    <div className="text-center py-12 sm:py-16 px-4">
      <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
        <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-pink-400" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto">
        Discover our beautiful collection of cosmetics and add some items to your cart.
      </p>
      <Button asChild size="lg" className="w-full sm:w-auto">
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
    <main className="custom_container py-6 sm:py-8">
      {/* Breadcrumb - Using Shadcn component */}
      <div className="max-w-7xl mx-auto">
        <PageBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Shopping Cart" },
          ]}
        />

        {/* Page Header - FIXED FOR MOBILE */}
        <PageHeader
          title="Shopping Cart"
          subtitle="Review your selected items and proceed to checkout when ready."
        />

        {/* Cart Content - FIXED GRID LAYOUT */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="lg:col-span-2">
              <CartItemsSkeleton />
            </div>
            <div className="lg:col-span-1">
              <div className="border rounded-lg p-4 sm:p-6 bg-card">
                <div className="h-5 sm:h-6 bg-gray-200 rounded animate-pulse mb-3 sm:mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
                <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse mt-4 sm:mt-6" />
              </div>
            </div>
          </div>
        }>
          <CartContent />
        </Suspense>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Shopping Cart | Cosmetics Store",
  description: "Review your selected cosmetics and beauty products before checkout.",
};