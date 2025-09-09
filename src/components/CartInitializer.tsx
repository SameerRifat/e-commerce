// src/components/CartInitializer.tsx
'use client';

import { useCartSync } from '@/hooks/use-cart-sync';

/**
 * Client component to initialize cart synchronization
 * This component should be included in the root layout
 */
export default function CartInitializer() {
  useCartSync();
  return null;
}
