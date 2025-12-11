/**
 * Simplified Cart Store - Industry Standard Pattern
 *
 * Pattern: Simple loading states (Shopify, WooCommerce, Amazon approach)
 * - No optimistic UI (server is source of truth)
 * - Clear loading/error states
 * - Re-fetch after mutations
 * - Predictable, reliable behavior
 *
 * Why no optimistic UI:
 * - Cart operations are infrequent (~5-10 per session)
 * - Users EXPECT brief loading when adding to cart
 * - Simpler code, fewer bugs
 * - Matches user mental model
 *
 * Industry References:
 * - Shopify: Simple loading spinners, no optimistic updates
 * - Amazon: POST + redirect pattern
 * - WooCommerce: Server-driven cart state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart as clearCartAction,
  type CartItemWithDetails
} from '@/lib/actions/cart';

interface CartItem {
  id: string;
  productId: string | null;
  productVariantId: string | null;
  isSimpleProduct: boolean;
  quantity: number;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  image?: string;
  color?: {
    name: string;
    hexCode: string;
  };
  size?: {
    name: string;
  };
  sku: string;
  inStock: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  syncWithServer: (silent?: boolean) => Promise<void>;
  addItem: (
    productId: string | null,
    productVariantId: string | null,
    isSimpleProduct: boolean,
    quantity?: number
  ) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;

  // UI actions
  getItemCount: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearError: () => void;

  // Utility
  formatPrice: (price: number) => string;
}

// Transform server cart item to client format
function transformCartItem(serverItem: CartItemWithDetails): CartItem {
  if (serverItem.isSimpleProduct && serverItem.product) {
    const primaryImage = serverItem.product.images.find(img => img.isPrimary) || serverItem.product.images[0];

    return {
      id: serverItem.id,
      productId: serverItem.productId,
      productVariantId: null,
      isSimpleProduct: true,
      quantity: serverItem.quantity,
      name: serverItem.product.name,
      slug: serverItem.product.slug,
      price: parseFloat(serverItem.product.price),
      salePrice: serverItem.product.salePrice ? parseFloat(serverItem.product.salePrice) : undefined,
      image: primaryImage?.url,
      sku: serverItem.product.sku,
      inStock: serverItem.product.inStock,
    };
  } else if (!serverItem.isSimpleProduct && serverItem.variant) {
    const primaryImage = serverItem.variant.images.find(img => img.isPrimary) || serverItem.variant.images[0];

    return {
      id: serverItem.id,
      productId: serverItem.variant.product.id,
      productVariantId: serverItem.productVariantId,
      isSimpleProduct: false,
      quantity: serverItem.quantity,
      name: serverItem.variant.product.name,
      slug: serverItem.variant.product.slug,
      price: parseFloat(serverItem.variant.price),
      salePrice: serverItem.variant.salePrice ? parseFloat(serverItem.variant.salePrice) : undefined,
      image: primaryImage?.url,
      color: serverItem.variant.color ? {
        name: serverItem.variant.color.name,
        hexCode: serverItem.variant.color.hexCode,
      } : undefined,
      size: serverItem.variant.size ? {
        name: serverItem.variant.size.name,
      } : undefined,
      sku: serverItem.variant.sku,
      inStock: serverItem.variant.inStock,
    };
  } else {
    console.error('Invalid cart item data:', serverItem);
    throw new Error('Invalid cart item data: missing product or variant information');
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isOpen: false,
      isLoading: false,
      error: null,

      // Sync cart with server (industry pattern: server is source of truth)
      syncWithServer: async (silent = false) => {
        try {
          if (!silent) set({ isLoading: true, error: null });

          const { items: serverItems, total } = await getCart();
          const clientItems = serverItems.map(transformCartItem);

          set({
            items: clientItems,
            total,
            isLoading: false,
            error: null
          });
        } catch (error) {
          console.error('Failed to sync cart with server:', error);
          set({
            isLoading: false,
            error: 'Failed to load cart. Please refresh the page.'
          });
        }
      },

      // Add item to cart (simple pattern: loading → server call → re-fetch)
      addItem: async (productId, productVariantId, isSimpleProduct, quantity = 1) => {
        set({ isLoading: true, error: null });

        try {
          const result = await addCartItem({
            productId: productId || undefined,
            productVariantId: productVariantId || undefined,
            isSimpleProduct,
            quantity
          });

          if (result.success) {
            // Re-fetch cart from server (source of truth)
            await get().syncWithServer(true);
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to add item to cart'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to add item to cart:', error);
          set({
            isLoading: false,
            error: 'Failed to add item to cart. Please try again.'
          });
          return false;
        }
      },

      // Update quantity (simple pattern)
      updateQuantity: async (cartItemId, quantity) => {
        if (quantity <= 0) {
          return await get().removeItem(cartItemId);
        }

        set({ isLoading: true, error: null });

        try {
          const result = await updateCartItem({ cartItemId, quantity });

          if (result.success) {
            await get().syncWithServer(true);
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to update quantity'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to update item quantity:', error);
          set({
            isLoading: false,
            error: 'Failed to update quantity. Please try again.'
          });
          return false;
        }
      },

      // Remove item (simple pattern)
      removeItem: async (cartItemId) => {
        set({ isLoading: true, error: null });

        try {
          const result = await removeCartItem({ cartItemId });

          if (result.success) {
            await get().syncWithServer(true);
            set({ isLoading: false });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to remove item'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          set({
            isLoading: false,
            error: 'Failed to remove item. Please try again.'
          });
          return false;
        }
      },

      // Clear cart (simple pattern)
      clearCart: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await clearCartAction();

          if (result.success) {
            set({
              items: [],
              total: 0,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            set({
              isLoading: false,
              error: result.error || 'Failed to clear cart'
            });
            return false;
          }
        } catch (error) {
          console.error('Failed to clear cart:', error);
          set({
            isLoading: false,
            error: 'Failed to clear cart. Please try again.'
          });
          return false;
        }
      },

      // UI actions
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      clearError: () => set({ error: null }),

      // Utility functions
      formatPrice: (price: number) => {
        return `Rs.${price.toLocaleString()}`;
      },
    }),
    {
      name: 'cart-storage',
      // Industry pattern: Only persist UI state, not cart data
      // Server is source of truth for cart items
      partialize: (state) => ({
        isOpen: state.isOpen,
      }),
    }
  )
);
