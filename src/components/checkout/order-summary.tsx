// src/components/checkout/order-summary.tsx

'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Truck, Shield, CreditCard } from 'lucide-react';
import { CartItemWithDetails } from '@/lib/actions/cart';
import { OrderCalculation, formatPrice } from '@/lib/utils/order-helpers';

interface OrderSummaryProps {
  cartItems: CartItemWithDetails[];
  calculation: OrderCalculation;
  paymentMethod: string;
  disabled?: boolean;
}

export function OrderSummary({ 
  cartItems, 
  calculation, 
  paymentMethod,
  disabled = false 
}: OrderSummaryProps) {
  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case 'cod':
        return 'Cash on Delivery';
      case 'jazzcash':
        return 'JazzCash';
      case 'easypaisa':
        return 'EasyPaisa';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg bg-gray-50">
                {/* Product Image */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                  {item.isSimpleProduct && item.product?.images?.[0] ? (
                    <Image
                      src={item.product.images.find(img => img.isPrimary)?.url || item.product.images[0].url}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : item.variant?.images?.[0] ? (
                    <Image
                      src={item.variant.images.find(img => img.isPrimary)?.url || item.variant.images[0].url}
                      alt={item.variant.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-pink-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                    {item.isSimpleProduct && item.product 
                      ? item.product.name 
                      : item.variant?.product.name || 'Unknown Product'}
                  </h3>
                  
                  {/* Variant Details */}
                  <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                    {/* Color */}
                    {item.variant?.color && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.variant.color.hexCode }}
                        />
                        <span>{item.variant.color.name}</span>
                      </div>
                    )}
                    
                    {/* Size */}
                    {item.variant?.size && (
                      <div className="flex items-center gap-1">
                        <span>Size:</span>
                        <span className="font-medium">{item.variant.size.name}</span>
                      </div>
                    )}
                    
                    {/* SKU */}
                    <div className="flex items-center gap-1">
                      <span>SKU:</span>
                      <span className="font-mono">{item.isSimpleProduct && item.product ? item.product.sku : item.variant?.sku}</span>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right">
                  {item.isSimpleProduct && item.product ? (
                    <div className="space-y-1">
                      {item.product.salePrice ? (
                        <>
                          <div className="font-semibold text-primary text-sm">
                            {formatPrice(parseFloat(item.product.salePrice) * item.quantity)}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(parseFloat(item.product.price) * item.quantity)}
                          </div>
                        </>
                      ) : (
                        <div className="font-semibold text-primary text-sm">
                          {formatPrice(parseFloat(item.product.price) * item.quantity)}
                        </div>
                      )}
                    </div>
                  ) : item.variant ? (
                    <div className="space-y-1">
                      {item.variant.salePrice ? (
                        <>
                          <div className="font-semibold text-primary text-sm">
                            {formatPrice(parseFloat(item.variant.salePrice) * item.quantity)}
                          </div>
                          <div className="text-xs text-gray-500 line-through">
                            {formatPrice(parseFloat(item.variant.price) * item.quantity)}
                          </div>
                        </>
                      ) : (
                        <div className="font-semibold text-primary text-sm">
                          {formatPrice(parseFloat(item.variant.price) * item.quantity)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="font-semibold text-primary text-sm">
                      {formatPrice(0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Order Totals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(calculation.subtotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping</span>
              <span className={`font-medium ${calculation.shippingCost === 0 ? 'text-green-600' : ''}`}>
                {calculation.shippingCost === 0 ? 'Free' : formatPrice(calculation.shippingCost)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium">{formatPrice(calculation.taxAmount)}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(calculation.totalAmount)}</span>
            </div>
          </div>

          {/* Shipping Information */}
          {calculation.shippingCost === 0 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Free Shipping Applied
                </span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Your order qualifies for free shipping
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Payment Method
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              {getPaymentMethodName(paymentMethod)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Secure Checkout</h4>
              <p className="text-sm text-gray-600">
                Your order is protected by our secure checkout system. 
                We never store your payment information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
