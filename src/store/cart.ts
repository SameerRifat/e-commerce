// src/store/cart.ts - Enhanced with Optimistic Updates and Race Condition Prevention
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
  // Optimistic update tracking
  isOptimistic?: boolean;
  tempId?: string; // For new items before server confirmation
  pendingOperation?: 'add' | 'update' | 'remove'; // Track pending operations
}

interface CartState {
  items: CartItem[];
  total: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Request tracking for deduplication
  pendingRequests: Map<string, Promise<boolean>>;

  // Actions
  syncWithServer: (silent?: boolean) => Promise<void>;
  addItem: (productId: string | null, productVariantId: string | null, isSimpleProduct: boolean, quantity?: number, productDetails?: Partial<CartItem>) => Promise<boolean>;
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
  if (serverItem.isSimpleProduct && serverItem.product) {
    // Handle simple product
    const primaryImage = serverItem.product.images.find(img => img.isPrimary) || serverItem.product.images[0];

    return {
      id: serverItem.id,
      productId: serverItem.productId, // This should now be populated
      productVariantId: null,
      isSimpleProduct: true,
      quantity: serverItem.quantity,
      name: serverItem.product.name,
      price: parseFloat(serverItem.product.price),
      salePrice: serverItem.product.salePrice ? parseFloat(serverItem.product.salePrice) : undefined,
      image: primaryImage?.url,
      sku: serverItem.product.sku,
      inStock: serverItem.product.inStock,
      isOptimistic: false,
    };
  } else if (!serverItem.isSimpleProduct && serverItem.variant) {
    // Handle configurable product variant
    const primaryImage = serverItem.variant.images.find(img => img.isPrimary) || serverItem.variant.images[0];

    return {
      id: serverItem.id,
      productId: serverItem.variant.product.id, // Use the product ID from the variant's product
      productVariantId: serverItem.productVariantId, // This should be populated
      isSimpleProduct: false,
      quantity: serverItem.quantity,
      name: serverItem.variant.product.name,
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
      isOptimistic: false,
    };
  } else {
    // Fallback for invalid data
    console.error('Invalid cart item data:', serverItem);
    throw new Error('Invalid cart item data: missing product or variant information');
  }
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
      pendingRequests: new Map(),

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

      addItem: async (productId: string | null, productVariantId: string | null, isSimpleProduct: boolean, quantity = 1, productDetails?: Partial<CartItem>) => {
        const state = get();

        // Create request key for deduplication
        const requestKey = `add-${productId || productVariantId}-${isSimpleProduct}`;

        // Check if request is already pending
        if (state.pendingRequests.has(requestKey)) {
          return await state.pendingRequests.get(requestKey)!;
        }

        // Create the request promise
        const requestPromise = (async () => {
          // Create optimistic item
          const tempId = `temp-${Date.now()}`;
          const optimisticItem: CartItem = {
            id: tempId,
            productId,
            productVariantId,
            isSimpleProduct,
            quantity,
            name: productDetails?.name || 'Loading...',
            price: productDetails?.price || 0,
            salePrice: productDetails?.salePrice,
            image: productDetails?.image,
            color: productDetails?.color,
            size: productDetails?.size,
            sku: productDetails?.sku || '',
            inStock: productDetails?.inStock || 0,
            isOptimistic: true,
            tempId,
            pendingOperation: 'add',
          };

          // Check if item already exists
          const existingItemIndex = state.items.findIndex(
            item => {
              if (isSimpleProduct) {
                return item.productId === productId && item.isSimpleProduct;
              } else {
                return item.productVariantId === productVariantId && !item.isSimpleProduct;
              }
            }
          );

          let newItems: CartItem[];
          if (existingItemIndex >= 0) {
            // Update existing item quantity optimistically
            newItems = [...state.items];
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + quantity,
              isOptimistic: true,
              pendingOperation: 'add',
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
            // Server update - FIXED: Always pass productId, even for configurable products
            const result = await addCartItem({
              productId: productId || undefined, // Always include productId when available
              productVariantId: productVariantId || undefined,
              isSimpleProduct,
              quantity
            });

            if (result.success) {
              // Update optimistic items to confirmed state
              set((currentState) => {
                const updatedItems = currentState.items.map(item => {
                  if (item.tempId === tempId ||
                    (item.pendingOperation === 'add' &&
                      ((isSimpleProduct && item.productId === productId) ||
                        (!isSimpleProduct && item.productVariantId === productVariantId)))) {
                    return {
                      ...item,
                      isOptimistic: false,
                      pendingOperation: undefined,
                    };
                  }
                  return item;
                });

                return {
                  items: updatedItems,
                  total: calculateTotal(updatedItems),
                };
              });
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
          } finally {
            // Remove from pending requests
            set((currentState) => {
              const newPendingRequests = new Map(currentState.pendingRequests);
              newPendingRequests.delete(requestKey);
              return { pendingRequests: newPendingRequests };
            });
          }
        })();

        // Store the request promise
        set((currentState) => {
          const newPendingRequests = new Map(currentState.pendingRequests);
          newPendingRequests.set(requestKey, requestPromise);
          return { pendingRequests: newPendingRequests };
        });

        return await requestPromise;
      },

      updateQuantity: async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) {
          return await get().removeItem(cartItemId);
        }

        const state = get();
        const itemIndex = state.items.findIndex(item => item.id === cartItemId);

        if (itemIndex === -1) return false;

        // Create request key for deduplication
        const requestKey = `update-${cartItemId}`;

        // Check if request is already pending
        if (state.pendingRequests.has(requestKey)) {
          return await state.pendingRequests.get(requestKey)!;
        }

        // Create the request promise
        const requestPromise = (async () => {
          // Optimistic update - quantity changes are immediate without progress UI
          const newItems = [...state.items];
          const oldQuantity = newItems[itemIndex].quantity;
          newItems[itemIndex] = {
            ...newItems[itemIndex],
            quantity,
            isOptimistic: false, // Quantity updates are immediate, not optimistic
            pendingOperation: undefined, // No progress UI for quantity changes
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
              // Quantity updates are already confirmed, no need to update state
              return true;
            } else {
              throw new Error(result.error || 'Failed to update item');
            }
          } catch (error) {
            console.error('Failed to update item quantity:', error);

            // Rollback to previous quantity
            const rollbackItems = [...state.items];
            rollbackItems[itemIndex] = {
              ...rollbackItems[itemIndex],
              quantity: oldQuantity,
            };

            set({
              items: rollbackItems,
              total: calculateTotal(rollbackItems),
              error: 'Failed to update quantity. Please try again.'
            });
            return false;
          } finally {
            // Remove from pending requests
            set((currentState) => {
              const newPendingRequests = new Map(currentState.pendingRequests);
              newPendingRequests.delete(requestKey);
              return { pendingRequests: newPendingRequests };
            });
          }
        })();

        // Store the request promise
        set((currentState) => {
          const newPendingRequests = new Map(currentState.pendingRequests);
          newPendingRequests.set(requestKey, requestPromise);
          return { pendingRequests: newPendingRequests };
        });

        return await requestPromise;
      },

      removeItem: async (cartItemId: string) => {
        const state = get();
        const itemToRemove = state.items.find(item => item.id === cartItemId);

        if (!itemToRemove) return false;

        // Create request key for deduplication
        const requestKey = `remove-${cartItemId}`;

        // Check if request is already pending
        if (state.pendingRequests.has(requestKey)) {
          return await state.pendingRequests.get(requestKey)!;
        }

        // Create the request promise
        const requestPromise = (async () => {
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
              // Item is already removed optimistically, no need to update
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
          } finally {
            // Remove from pending requests
            set((currentState) => {
              const newPendingRequests = new Map(currentState.pendingRequests);
              newPendingRequests.delete(requestKey);
              return { pendingRequests: newPendingRequests };
            });
          }
        })();

        // Store the request promise
        set((currentState) => {
          const newPendingRequests = new Map(currentState.pendingRequests);
          newPendingRequests.set(requestKey, requestPromise);
          return { pendingRequests: newPendingRequests };
        });

        return await requestPromise;
      },

      clearCart: async () => {
        const state = get();

        // Create request key for deduplication
        const requestKey = 'clear-cart';

        // Check if request is already pending
        if (state.pendingRequests.has(requestKey)) {
          return await state.pendingRequests.get(requestKey)!;
        }

        // Create the request promise
        const requestPromise = (async () => {
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
          } finally {
            // Remove from pending requests
            set((currentState) => {
              const newPendingRequests = new Map(currentState.pendingRequests);
              newPendingRequests.delete(requestKey);
              return { pendingRequests: newPendingRequests };
            });
          }
        })();

        // Store the request promise
        set((currentState) => {
          const newPendingRequests = new Map(currentState.pendingRequests);
          newPendingRequests.set(requestKey, requestPromise);
          return { pendingRequests: newPendingRequests };
        });

        return await requestPromise;
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
      getItemByProductId: (productId: string) => {
        return get().items.find(item => item.productId === productId);
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