// src/components/checkout/order-confirmation.tsx

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Truck, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  Calendar,
  Package,
  Clock,
  Mail,
  ChevronRight
} from 'lucide-react';
import { OrderWithDetails } from '@/lib/actions/orders';
import { formatPrice, generateOrderNumber, estimateDeliveryDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils/order-helpers';

interface OrderConfirmationProps {
  order: OrderWithDetails;
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const orderNumber = generateOrderNumber(order.id);
  const estimatedDelivery = estimateDeliveryDate();

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state}`,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header - Enhanced */}
      <div className="text-center py-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your order. We've received your order and will process it shortly.
        </p>
        
        {/* Key Order Info */}
        <div className="inline-flex items-center gap-6 bg-white rounded-lg px-6 py-3 shadow-sm border">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Order #{orderNumber}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{formatPrice(parseFloat(order.totalAmount.toString()))}</span>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Items ({order.items.length})
                </div>
                <Badge variant="outline" className={ORDER_STATUS_COLORS[order.status]}>
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex gap-4">
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
                        
                        {/* Variant Details - Simplified */}
                        <div className="flex items-center gap-2 mb-1 text-xs text-gray-600">
                          {item.variant?.color && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-200"
                                style={{ backgroundColor: item.variant.color.hexCode }}
                              />
                              <span>{item.variant.color.name}</span>
                            </div>
                          )}
                          {item.variant?.size && (
                            <div className="flex items-center gap-1">
                              <span>•</span>
                              <span>{item.variant.size.name}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {item.salePriceAtPurchase ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-sm">
                              {formatPrice(item.salePriceAtPurchase * item.quantity)}
                            </div>
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(item.priceAtPurchase * item.quantity)}
                            </div>
                          </div>
                        ) : (
                          <div className="font-semibold text-sm">
                            {formatPrice(item.priceAtPurchase * item.quantity)}
                          </div>
                        )}
                      </div>
                    </div>
                    {index < order.items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Simplified Summary */}
        <div className="space-y-6">
          {/* Order Summary - Streamlined */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(parseFloat(order.subtotal.toString()))}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={parseFloat(order.shippingCost.toString()) === 0 ? 'text-green-600' : ''}>
                    {parseFloat(order.shippingCost.toString()) === 0 ? 'Free' : formatPrice(parseFloat(order.shippingCost.toString()))}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatPrice(parseFloat(order.taxAmount.toString()))}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg">{formatPrice(parseFloat(order.totalAmount.toString()))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Payment - Combined */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Shipping Address */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">Shipping to</span>
                  </div>
                  {order.shippingAddress ? (
                    <div className="pl-6 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{order.shippingAddress.fullName}</div>
                      <div>{formatAddress(order.shippingAddress)}</div>
                    </div>
                  ) : (
                    <p className="pl-6 text-sm text-gray-500">No shipping address provided</p>
                  )}
                </div>

                <Separator />

                {/* Payment Method */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm">Payment</span>
                  </div>
                  <div className="pl-6 text-sm text-gray-600">
                    <div>
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                       order.paymentMethod === 'jazzcash' ? 'JazzCash' :
                       order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total: {formatPrice(parseFloat(order.totalAmount.toString()))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Prominent */}
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full">
              <Link href="/profile/orders">
                View All Orders
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="w-full">
              <Link href="/products">
                Continue Shopping
              </Link>
            </Button>
          </div>

          {/* Support - Minimal */}
          {/* <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Mail className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">
                  Questions? Email us at{' '}
                  <a href="mailto:support@example.com" className="text-primary hover:underline">
                    support@example.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>

      {/* Order Notes - Only if exists */}
      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{order.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}