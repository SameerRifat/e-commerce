// src/components/cart/CartPageClient.tsx
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
    slug: item.isSimpleProduct && item.product 
      ? item.product.slug 
      : item.variant?.product.slug || '',
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

  // Show empty cart if no items - FIXED FOR MOBILE
  if (displayItems.length === 0) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
      {/* Cart Items - COMPLETELY REDESIGNED FOR MOBILE */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-medium text-gray-900">
            Cart Items ({displayItems.length})
          </h2>
          {isLoading && (
            <div className="text-xs sm:text-sm text-gray-500">Updating...</div>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 border rounded-lg bg-card hover:shadow-sm transition-shadow ${
                shouldShowProgressUI(item) ? 'opacity-75 border-blue-200 bg-blue-50' : ''
              }`}
            >
              {/* Mobile & Desktop: Image + Details Section */}
              <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                {/* Product Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 pr-2">
                    {item.slug ? (
                      <Link 
                        href={`/products/${item.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span>{item.name}</span>
                    )}
                  </h3>
                  
                  {/* Variant Details */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
                    {/* Color */}
                    {item.color && (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <div 
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: item.color.hexCode }}
                          title={item.color.name}
                        />
                        <span className="truncate">{item.color.name}</span>
                      </div>
                    )}
                    
                    {/* Size */}
                    {item.size && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span>Size:</span>
                        <span className="font-medium">{item.size.name}</span>
                      </div>
                    )}
                    
                    {/* SKU */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span>SKU:</span>
                      <span className="font-mono text-xs truncate max-w-[100px]">{item.sku}</span>
                    </div>
                  </div>

                  {/* Stock Status */}
                  {item.inStock <= 5 && (
                    <div className="mb-3">
                      <span className={`text-xs sm:text-sm px-2 py-1 rounded-full inline-block ${
                        item.inStock === 0 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {item.inStock === 0 ? 'Out of stock' : `Only ${item.inStock} left in stock`}
                      </span>
                    </div>
                  )}

                  {/* Quantity Controls - Desktop & Mobile */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center border rounded-lg flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-r-none"
                        disabled={isLoading || item.quantity <= 1}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <div className="w-12 sm:w-16 text-center py-2 border-x text-sm sm:text-base">
                        {item.quantity}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-l-none"
                        disabled={isLoading || item.inStock === 0}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading || item.pendingOperation === 'remove'}
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm h-9 sm:h-10"
                    >
                      {item.pendingOperation === 'remove' ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin mr-1.5 sm:mr-2" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              {/* Price Column - Desktop Only */}
              <div className="hidden sm:block text-right flex-shrink-0 min-w-[120px]">
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

              {/* Price Row - Mobile Only */}
              <div className="sm:hidden flex items-center justify-between gap-4 pt-3 border-t">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {item.salePrice ? (
                      <>
                        <div className="text-base font-semibold text-primary whitespace-nowrap">
                          {formatPrice(item.salePrice)}
                        </div>
                        <div className="text-xs text-gray-500 line-through whitespace-nowrap">
                          {formatPrice(item.price)}
                        </div>
                      </>
                    ) : (
                      <div className="text-base font-semibold text-primary whitespace-nowrap">
                        {formatPrice(item.price)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
                  Total: <span className="font-semibold text-gray-900">{formatPrice((item.salePrice || item.price) * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary - FIXED FOR MOBILE */}
      <div className="lg:col-span-1">
        <div className="border rounded-lg p-4 sm:p-6 bg-card lg:sticky lg:top-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>
          
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Shipping</span>
              <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </span>
            </div>
            
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>
            
            <div className="border-t pt-3 sm:pt-4">
              <div className="flex justify-between text-base sm:text-lg font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="space-y-2.5 sm:space-y-3">
            {user ? (
              <Button asChild className="w-full h-11 sm:h-12 text-sm sm:text-base" size="lg">
                <Link href="/checkout">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Proceed to Checkout
                </Link>
              </Button>
            ) : (
              <Button asChild className="w-full h-11 sm:h-12 text-sm sm:text-base" size="lg">
                <Link href="/sign-in?returnUrl=/cart">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Sign In to Checkout
                </Link>
              </Button>
            )}
            
            <Button variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base" asChild>
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Features - FIXED FOR MOBILE */}
          <div className="mt-6 sm:mt-8 space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center gap-2 sm:gap-3">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              <span>Secure checkout guaranteed</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <span>Free shipping on orders over Rs.2,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}