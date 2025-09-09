// src/store/cart.ts - Enhanced with Optimistic Updates
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
  productVariantId: string;
  quantity: number;
  name: string;
  price: number;
  salePrice?: number;
  image?: string;
  color: {
    name: string;
    hexCode: string;
  };
  size: {
    name: string;
  };
  sku: string;
  inStock: number;
  // Optimistic update tracking
  isOptimistic?: boolean;
  tempId?: string; // For new items before server confirmation
}

interface CartState {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  syncWithServer: (silent?: boolean) => Promise<void>;
  addItem: (productVariantId: string, quantity?: number, productDetails?: Partial<CartItem>) => Promise<boolean>;
  removeItem: (cartItemId: string) => Promise<boolean>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  
  // UI actions
  getItemCount: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  clearError: () => void;
  
  // Utility functions
  getItemByVariantId: (productVariantId: string) => CartItem | undefined;
  formatPrice: (price: number) => string;
}

function transformCartItem(serverItem: CartItemWithDetails): CartItem {
  const primaryImage = serverItem.variant.images.find(img => img.isPrimary) || serverItem.variant.images[0];
  
  return {
    id: serverItem.id,
    productVariantId: serverItem.productVariantId,
    quantity: serverItem.quantity,
    name: serverItem.variant.product.name,
    price: parseFloat(serverItem.variant.price),
    salePrice: serverItem.variant.salePrice ? parseFloat(serverItem.variant.salePrice) : undefined,
    image: primaryImage?.url,
    color: {
      name: serverItem.variant.color.name,
      hexCode: serverItem.variant.color.hexCode,
    },
    size: {
      name: serverItem.variant.size.name,
    },
    sku: serverItem.variant.sku,
    inStock: serverItem.variant.inStock,
    isOptimistic: false,
  };
}

function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const price = item.salePrice || item.price;
    return sum + (price * item.quantity);
  }, 0);
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isOpen: false,
      isLoading: false,
      error: null,

      syncWithServer: async (silent = false) => {
        try {
          if (!silent) set({ isLoading: true });
          
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
            error: 'Failed to sync cart. Please refresh the page.'
          });
        }
      },

      addItem: async (productVariantId: string, quantity = 1, productDetails) => {
        const state = get();
        
        // Create optimistic item
        const tempId = `temp-${Date.now()}`;
        const optimisticItem: CartItem = {
          id: tempId,
          productVariantId,
          quantity,
          name: productDetails?.name || 'Loading...',
          price: productDetails?.price || 0,
          salePrice: productDetails?.salePrice,
          image: productDetails?.image,
          color: productDetails?.color || { name: 'Unknown', hexCode: '#000000' },
          size: productDetails?.size || { name: 'Unknown' },
          sku: productDetails?.sku || '',
          inStock: productDetails?.inStock || 0,
          isOptimistic: true,
          tempId,
        };

        // Check if item already exists
        const existingItemIndex = state.items.findIndex(
          item => item.productVariantId === productVariantId
        );

        let newItems: CartItem[];
        if (existingItemIndex >= 0) {
          // Update existing item quantity optimistically
          newItems = [...state.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            isOptimistic: true,
          };
        } else {
          // Add new item optimistically
          newItems = [...state.items, optimisticItem];
        }

        const newTotal = calculateTotal(newItems);

        // Optimistic update
        set({ 
          items: newItems, 
          total: newTotal,
          error: null
        });

        try {
          // Server update
          const result = await addCartItem({ productVariantId, quantity });
          
          if (result.success) {
            // Silent sync to get actual server state
            await get().syncWithServer(true);
            return true;
          } else {
            throw new Error(result.error || 'Failed to add item');
          }
        } catch (error) {
          console.error('Failed to add item to cart:', error);
          
          // Rollback optimistic update
          set({ 
            items: state.items, 
            total: state.total,
            error: 'Failed to add item to cart. Please try again.'
          });
          return false;
        }
      },

      updateQuantity: async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
          return await get().removeItem(cartItemId);
        }

        const state = get();
        const itemIndex = state.items.findIndex(item => item.id === cartItemId);
        
        if (itemIndex === -1) return false;

        // Optimistic update
        const newItems = [...state.items];
        const oldQuantity = newItems[itemIndex].quantity;
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          quantity,
          isOptimistic: true,
        };

        const newTotal = calculateTotal(newItems);
        
        set({ 
          items: newItems, 
          total: newTotal,
          error: null
        });

        try {
          const result = await updateCartItem({ cartItemId, quantity });
          
          if (result.success) {
            // Silent sync to get actual server state
            await get().syncWithServer(true);
            return true;
          } else {
            throw new Error(result.error || 'Failed to update item');
          }
        } catch (error) {
          console.error('Failed to update item quantity:', error);
          
          // Rollback optimistic update
          const rollbackItems = [...state.items];
          rollbackItems[itemIndex] = {
            ...rollbackItems[itemIndex],
            quantity: oldQuantity,
            isOptimistic: false,
          };
          
          set({ 
            items: rollbackItems, 
            total: calculateTotal(rollbackItems),
            error: 'Failed to update quantity. Please try again.'
          });
          return false;
        }
      },

      removeItem: async (cartItemId: string) => {
        const state = get();
        const itemToRemove = state.items.find(item => item.id === cartItemId);
        
        if (!itemToRemove) return false;

        // Optimistic update - remove item immediately
        const newItems = state.items.filter(item => item.id !== cartItemId);
        const newTotal = calculateTotal(newItems);
        
        set({ 
          items: newItems, 
          total: newTotal,
          error: null
        });

        try {
          const result = await removeCartItem({ cartItemId });
          
          if (result.success) {
            // Silent sync to ensure consistency
            await get().syncWithServer(true);
            return true;
          } else {
            throw new Error(result.error || 'Failed to remove item');
          }
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          
          // Rollback - add item back
          const rollbackItems = [...state.items, itemToRemove];
          set({ 
            items: rollbackItems, 
            total: calculateTotal(rollbackItems),
            error: 'Failed to remove item. Please try again.'
          });
          return false;
        }
      },

      clearCart: async () => {
        const state = get();
        
        // Optimistic update
        set({ 
          items: [], 
          total: 0,
          error: null
        });

        try {
          const result = await clearCartAction();
          
          if (result.success) {
            return true;
          } else {
            throw new Error(result.error || 'Failed to clear cart');
          }
        } catch (error) {
          console.error('Failed to clear cart:', error);
          
          // Rollback
          set({ 
            items: state.items, 
            total: state.total,
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
      getItemByVariantId: (productVariantId: string) => {
        return get().items.find(item => item.productVariantId === productVariantId);
      },
      
      formatPrice: (price: number) => {
        return `Rs.${price.toLocaleString()}`;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items.filter(item => !item.isOptimistic), // Don't persist optimistic items
        total: state.total,
      }),
    }
  )
);