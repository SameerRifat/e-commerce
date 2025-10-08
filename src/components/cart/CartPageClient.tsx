'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingBag, CreditCard, Shield, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import type { CartItemWithDetails } from "@/lib/actions/cart";

interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

interface CartPageClientProps {
  initialItems: CartItemWithDetails[];
  initialTotal: number;
  user: User | null;
}

export function CartPageClient({ initialItems, initialTotal, user }: CartPageClientProps) {
  const { 
    items, 
    total, 
    isLoading,
    updateQuantity, 
    removeItem,
    formatPrice,
    syncWithServer 
  } = useCartStore();
  console.log('items:', JSON.stringify(items, null, 2));

  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
    // Sync with server to ensure we have the latest data
    syncWithServer();
  }, [syncWithServer]);

  // Use server-side data until client hydrates
  const displayItems = mounted ? items : initialItems.map(item => ({
    id: item.id,
    productId: item.productId,
    productVariantId: item.productVariantId,
    isSimpleProduct: item.isSimpleProduct,
    quantity: item.quantity,
    name: item.isSimpleProduct && item.product 
      ? item.product.name 
      : item.variant?.product.name || 'Unknown Product',
    price: item.isSimpleProduct && item.product
      ? parseFloat(item.product.price)
      : item.variant ? parseFloat(item.variant.price) : 0,
    salePrice: item.isSimpleProduct && item.product
      ? (item.product.salePrice ? parseFloat(item.product.salePrice) : undefined)
      : item.variant?.salePrice ? parseFloat(item.variant.salePrice) : undefined,
    image: item.isSimpleProduct && item.product
      ? (item.product.images.find(img => img.isPrimary)?.url || item.product.images[0]?.url)
      : item.variant?.images.find(img => img.isPrimary)?.url || item.variant?.images[0]?.url,
    color: item.isSimpleProduct ? undefined : item.variant?.color ? {
      name: item.variant.color.name,
      hexCode: item.variant.color.hexCode,
    } : undefined,
    size: item.isSimpleProduct ? undefined : item.variant?.size ? {
      name: item.variant.size.name,
    } : undefined,
    sku: item.isSimpleProduct && item.product
      ? item.product.sku
      : item.variant?.sku || 'Unknown SKU',
    inStock: item.isSimpleProduct && item.product
      ? item.product.inStock
      : item.variant?.inStock || 0,
    // Add optimistic properties for server-side items (they won't be optimistic)
    isOptimistic: false,
    pendingOperation: undefined,
  }));

  const displayTotal = mounted ? total : initialTotal;

  // Helper function to determine if operation should show progress UI
  const shouldShowProgressUI = (item: typeof displayItems[0]) => {
    return item.isOptimistic && (item.pendingOperation === 'add' || item.pendingOperation === 'remove');
  };

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    await updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    await removeItem(cartItemId);
  };

  const subtotal = displayTotal;
  const shipping = subtotal >= 2500 ? 0 : 250; // Free shipping over Rs.2,500
  const tax = Math.round(subtotal * 0.1); // 10% tax
  const finalTotal = subtotal + shipping + tax;

  // Show empty cart if no items
  if (displayItems.length === 0) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Cart Items ({displayItems.length})
          </h2>
          {isLoading && (
            <div className="text-sm text-gray-500">Updating...</div>
          )}
        </div>

        <div className="space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`flex gap-6 p-6 border rounded-lg bg-card hover:shadow-sm transition-shadow ${
                shouldShowProgressUI(item) ? 'opacity-75 border-blue-200 bg-blue-50' : ''
              }`}
            >
              {/* Product Image */}
              <div className="relative w-24 h-24 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-pink-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2">
                  <Link 
                    href={`/products/${item.productId}`}
                    className="hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </h3>
                
                {/* Variant Details */}
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  {/* Color */}
                  {item.color && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                        style={{ backgroundColor: item.color.hexCode }}
                        title={item.color.name}
                      />
                      <span>{item.color.name}</span>
                    </div>
                  )}
                  
                  {/* Size */}
                  {item.size && (
                    <div className="flex items-center gap-1">
                      <span>Size:</span>
                      <span className="font-medium">{item.size.name}</span>
                    </div>
                  )}
                  
                  {/* SKU */}
                  <div className="flex items-center gap-1">
                    <span>SKU:</span>
                    <span className="font-mono text-xs">{item.sku}</span>
                  </div>
                </div>

                {/* Stock Status */}
                {item.inStock <= 5 && (
                  <div className="mb-3">
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      item.inStock === 0 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {item.inStock === 0 ? 'Out of stock' : `Only ${item.inStock} left in stock`}
                    </span>
                  </div>
                )}

                {/* Optimistic Update Indicator - Only for destructive operations */}
                {shouldShowProgressUI(item) && (
                  <div className="mb-3">
                    <span className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                      {item.pendingOperation === 'add' ? 'Adding to cart...' : 
                       item.pendingOperation === 'remove' ? 'Removing...' : 'Processing...'}
                    </span>
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-r-none"
                      disabled={isLoading || item.quantity <= 1}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="w-16 text-center py-2 border-x">
                      {item.quantity}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-l-none"
                      disabled={isLoading || item.inStock === 0}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading || item.pendingOperation === 'remove'}
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {item.pendingOperation === 'remove' ? (
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {item.pendingOperation === 'remove' ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>

              {/* Price */}
              <div className="text-right">
                <div className="space-y-1">
                  {item.salePrice ? (
                    <>
                      <div className="text-lg font-semibold text-primary">
                        {formatPrice(item.salePrice)}
                      </div>
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(item.price)}
                      </div>
                    </>
                  ) : (
                    <div className="text-lg font-semibold text-primary">
                      {formatPrice(item.price)}
                    </div>
                  )}
                </div>
                
                {/* Total for this item */}
                <div className="mt-2 text-sm text-gray-600">
                  Total: {formatPrice((item.salePrice || item.price) * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="border rounded-lg p-6 bg-card sticky top-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="space-y-3">
            {user ? (
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full" size="lg">
                <Link href="/sign-in?returnUrl=/cart">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Sign In to Checkout
                </Link>
              </Button>
            )}
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="mt-8 space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-green-600" />
              <span>Secure checkout guaranteed</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>Free shipping on orders over Rs.2,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
