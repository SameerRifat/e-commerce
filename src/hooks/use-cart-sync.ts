// src/hooks/use-cart-sync.ts
'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/store/cart';

/**
 * Hook to sync cart with server on app initialization
 * Should be used in the root layout or main app component
 */
export function useCartSync() {
  const { syncWithServer } = useCartStore();

  useEffect(() => {
    // Sync cart with server on app startup
    syncWithServer();
  }, [syncWithServer]);
}
