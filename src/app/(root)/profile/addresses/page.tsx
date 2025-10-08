// src/app/(root)/profile/addresses/page.tsx
import { Suspense } from 'react';
import { AddressesPageClient } from '@/components/profile/addresses/addresses-page-client';
import { AddressErrorBoundary } from '@/components/profile/addresses/address-error-boundary';
import { getUserAddresses } from '@/lib/actions/address-management';
import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

// Loading skeleton component
const AddressesLoading = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  );
};

const AddressesPage = async () => {
  // Check authentication
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin?redirect=/profile/addresses');
  }

  // Fetch user addresses
  const addresses = await getUserAddresses();

  return (
    <AddressErrorBoundary>
      <Suspense fallback={<AddressesLoading />}>
        <div className="space-y-6">
          <AddressesPageClient initialAddresses={addresses} />
        </div>
      </Suspense>
    </AddressErrorBoundary>
  );
};

export default AddressesPage;