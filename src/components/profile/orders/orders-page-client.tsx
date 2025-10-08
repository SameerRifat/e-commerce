// src/components/profile/orders/orders-page-client.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  ShoppingBag, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderWithDetails } from '@/lib/actions/orders';
import { 
  formatPrice, 
  generateOrderNumber, 
  ORDER_STATUS_LABELS, 
  ORDER_STATUS_COLORS,
  estimateDeliveryDate,
} from '@/lib/utils/order-helpers';
import { OrderItemDisplay } from './order-item-display';
import { OrderActions } from './order-actions';

interface OrdersPageClientProps {
  initialOrders: OrderWithDetails[];
}

export const OrdersPageClient = ({ initialOrders }: OrdersPageClientProps) => {
  console.log('initialOrders: ', JSON.stringify(initialOrders, null, 2));
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders);
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

  const getStatusConfig = (status: string) => {
    const configs = {
      delivered: {
        label: ORDER_STATUS_LABELS.delivered,
        className: ORDER_STATUS_COLORS.delivered,
        icon: CheckCircle2
      },
      out_for_delivery: {
        label: ORDER_STATUS_LABELS.out_for_delivery,
        className: ORDER_STATUS_COLORS.out_for_delivery,
        icon: Truck
      },
      shipped: {
        label: ORDER_STATUS_LABELS.shipped,
        className: ORDER_STATUS_COLORS.shipped,
        icon: Truck
      },
      processing: {
        label: ORDER_STATUS_LABELS.processing,
        className: ORDER_STATUS_COLORS.processing,
        icon: Package
      },
      paid: {
        label: ORDER_STATUS_LABELS.paid,
        className: ORDER_STATUS_COLORS.paid,
        icon: CheckCircle2
      },
      pending: {
        label: ORDER_STATUS_LABELS.pending,
        className: ORDER_STATUS_COLORS.pending,
        icon: Clock
      },
      cancelled: {
        label: ORDER_STATUS_LABELS.cancelled,
        className: ORDER_STATUS_COLORS.cancelled,
        icon: XCircle
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const handleCancelOrder = async (orderId: string) => {
    setLoadingActions(prev => ({ ...prev, [orderId]: true }));

    try {
      const { cancelOrder } = await import('@/lib/actions/orders');
      const result = await cancelOrder(orderId);

      if (result.success) {
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: 'cancelled' as const }
            : order
        ));
        toast.success('Order cancelled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Cancel order error:', error);
    } finally {
      setLoadingActions(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleReorder = async (order: OrderWithDetails) => {
    try {
      // Implementation would add items back to cart
      toast.success('Items added to cart');
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'No address provided';
    const parts = [
      address.line1,
      address.line2,
      `${address.city}, ${address.state}`,
      address.postalCode,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const formatOrderDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getDeliveryStatus = (orderDate: Date, status: string) => {
    if (status === 'delivered') return 'Delivered';
    if (status === 'cancelled') return 'Cancelled';
    
    const estimatedDate = estimateDeliveryDate(orderDate, status);
    
    return `Est. ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(estimatedDate)}`;
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You haven&apos;t placed any orders yet. Start shopping to see your orders here.
            </p>
            <Button asChild size="lg">
              <Link href="/products">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start Shopping
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">
          Track and manage your {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          const orderNumber = generateOrderNumber(order.id);
          const isLoading = loadingActions[order.id];

          return (
            <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50/50">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CardTitle className="text-lg">
                        Order #{orderNumber}
                      </CardTitle>
                      <Badge className={`${statusConfig.className} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatOrderDate(order.createdAt)}
                      </span>
                      <span>•</span>
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </CardDescription>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-start gap-2">
                    <Button variant="default" size="sm" asChild>
                      <Link href={`/profile/orders/${order.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                {/* Status Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-medium text-sm">{statusConfig.label}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Delivery</p>
                    <p className="font-medium text-sm">
                      {getDeliveryStatus(order.createdAt, order.status)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment</p>
                    <p className="font-medium text-sm capitalize">
                      {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Delivery Address */}
                {order.shippingAddress && (
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">
                      Shipping To
                    </p>
                    <div className="text-sm">
                      <p className="font-medium">{order.shippingAddress.fullName}</p>
                      <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                        {formatAddress(order.shippingAddress)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Order Items Preview */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Order Items
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.items.slice(0, 2).map((item) => (
                      <OrderItemDisplay key={item.id} item={item} />
                    ))}
                  </div>
                  
                  {order.items.length > 2 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/profile/orders/${order.id}`}>
                          + {order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.shippingCost > 0 ? (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{formatPrice(order.shippingCost)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                  )}
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatPrice(order.taxAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>

                {/* Order Actions */}
                <OrderActions
                  order={order}
                  onCancel={handleCancelOrder}
                  onReorder={handleReorder}
                  isLoading={isLoading}
                />

                {/* Order Notes */}
                {order.notes && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      Order Notes
                    </p>
                    <p className="text-sm text-blue-800">{order.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};