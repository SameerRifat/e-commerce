// src/components/checkout/order-summary.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Truck, CreditCard } from 'lucide-react';

interface CartItem {
  id: string;
  productName: string;
  productSlug: string;
  sku: string;
  quantity: number;
  price: number;
  salePrice: number | null;
  image: string | null;
  color?: {
    name: string;
    hexCode: string;
  };
  size?: {
    name: string;
  };
}

interface Calculation {
  subtotal: string;
  shippingCost: string;
  taxAmount: string;
  totalAmount: string;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  calculation: Calculation;
  paymentMethod: string;
}

const formatPrice = (amount: number) => {
  return `Rs.${amount.toLocaleString('en-PK')}`;
};

const getPaymentMethodName = (method: string) => {
  const names: Record<string, string> = {
    cod: 'Cash on Delivery',
    jazzcash: 'JazzCash',
    easypaisa: 'EasyPaisa',
  };
  return names[method] || 'Unknown';
};

export function OrderSummary({ 
  cartItems, 
  calculation, 
  paymentMethod,
}: OrderSummaryProps) {
  console.log('cartItems: ', JSON.stringify(cartItems, null, 2))
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Items List with Images */}
        <div className="space-y-4">
          {cartItems.map((item) => {
            const finalPrice = item.salePrice ?? item.price;
            const hasDiscount = item.salePrice && item.salePrice < item.price;
            
            return (
              <div key={item.id} className="flex gap-3">
                {/* Product Image */}
                <div className="relative w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-md overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-pink-400" />
                    </div>
                  )}
                  
                  {/* Quantity Badge */}
                  {/* <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                    {item.quantity}
                  </div> */}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  {/* Product Name - Clickable */}
                  <Link 
                    href={`/products/${item.productSlug}`}
                    className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 text-sm block mb-1"
                  >
                    {item.productName}
                  </Link>
                  
                  {/* Variant Details */}
                  {(item.color || item.size) && (
                    <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                      {item.color && (
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: item.color.hexCode }}
                            title={item.color.name}
                          />
                          <span>{item.color.name || item.color.hexCode}</span>
                        </div>
                      )}
                      {item.size && (
                        <span>• {item.size.name}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(finalPrice * item.quantity)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(finalPrice)} × {item.quantity}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(parseFloat(calculation.subtotal))}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={`font-medium ${parseFloat(calculation.shippingCost) === 0 ? 'text-green-600' : ''}`}>
              {parseFloat(calculation.shippingCost) === 0 ? 'Free' : formatPrice(parseFloat(calculation.shippingCost))}
            </span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax (10%)</span>
            <span className="font-medium">{formatPrice(parseFloat(calculation.taxAmount))}</span>
          </div>
          
          <Separator />
          
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(parseFloat(calculation.totalAmount))}</span>
          </div>
        </div>

        <Separator />

        {/* Shipping Information */}
        {parseFloat(calculation.shippingCost) === 0 && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Free Shipping Applied!
              </span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Your order qualifies for free delivery
            </p>
          </div>
        )}

        {/* Payment Method Info */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
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
  );
}