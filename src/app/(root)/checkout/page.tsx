// src/app/(root)/checkout/page.tsx

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { initializeCheckout } from '@/lib/actions/checkout';
import PageHeader from '@/components/shared/page-header';
import { PageBreadcrumb } from '@/components/shared/page-breadcrumb';

function CheckoutSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <div className="p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-48" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Right Column */}
      <div className="lg:col-span-1">
        <Card>
          <div className="p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-12 bg-gray-200 rounded animate-pulse w-full mt-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CheckoutError({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Checkout Error
          </h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/cart">Back to Cart</Link>
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

async function CheckoutContent() {
  const result = await initializeCheckout();

  // Handle redirects
  if (!result.success && result.redirectTo) {
    redirect(result.redirectTo);
  }

  // Handle errors
  if (!result.success || !result.data) {
    return <CheckoutError message={result.error || "Failed to load checkout"} />;
  }

  console.log('cartItems: ', JSON.stringify(result.data.cartItems, null, 2))
  return (
    <CheckoutForm
      cartItems={result.data.cartItems}
      calculation={result.data.calculation}
      userAddresses={result.data.userAddresses}
    />
  );
}

export default async function CheckoutPage() {
  return (
    <main className="custom_container py-6 sm:py-8">
      {/* Breadcrumb - Using Shadcn component */}
      <div className='max-w-7xl mx-auto'>
        <PageBreadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Cart", href: "/cart" },
            { label: "Checkout" },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Checkout"
          subtitle="Complete your order by providing shipping and payment information."
        />

        {/* Checkout Content */}
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </main>
  );
}

export const metadata = {
  title: "Checkout",
  description: "Complete your order with secure checkout.",
  robots: {
    index: false,
    follow: false,
  },
};