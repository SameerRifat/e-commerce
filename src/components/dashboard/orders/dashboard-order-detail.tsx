// src/components/dashboard/orders/dashboard-order-detail.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package,
  MapPin,
  CreditCard,
  User,
  Phone,
  Calendar,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderWithDetails } from '@/lib/actions/orders';
import { updateDashboardOrderStatus, deleteOrder } from '@/lib/actions/dashboard/orders';
import {
  formatPrice,
  generateOrderNumber,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  getOrderTimeline,
} from '@/lib/utils/order-helpers';
import { OrderItemDisplay } from '@/components/profile/orders/order-item-display';

interface DashboardOrderDetailProps {
  order: OrderWithDetails;
}

export function DashboardOrderDetail({ order: initialOrder }: DashboardOrderDetailProps) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithDetails>(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const orderNumber = generateOrderNumber(order.id);
  const timeline = getOrderTimeline(order.paymentMethod);

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      delivered: CheckCircle2,
      out_for_delivery: Truck,
      shipped: Truck,
      processing: Package,
      paid: CheckCircle2,
      pending: Clock,
      cancelled: XCircle,
    };
    return icons[status] || Clock;
  };

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

  const formatOrderDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleStatusUpdate = async (newStatus: any) => {
    setIsUpdating(true);
    try {
      const result = await updateDashboardOrderStatus(order.id, newStatus);
      if (result.success) {
        setOrder(prev => ({ ...prev, status: newStatus }));
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    try {
      const result = await deleteOrder(order.id);
      if (result.success) {
        toast.success(result.message);
        router.push('/dashboard/orders');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete order');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const StatusIcon = getStatusIcon(order.status);

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <StatusIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="text-2xl font-bold">Order #{orderNumber}</h2>
                  <Badge className={`${ORDER_STATUS_COLORS[order.status]} border`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Placed on {formatOrderDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>{order.items.length} items</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Order Total</div>
                <div className="text-2xl font-bold">{formatPrice(order.totalAmount)}</div>
              </div>
              
              {/* Status Update */}
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={isUpdating || order.status === 'cancelled' || order.status === 'delivered'}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancel Order</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Status Info */}
              {(order.status === 'cancelled' || order.status === 'delivered') && (
                <p className="text-xs text-muted-foreground text-center">
                  {order.status === 'cancelled' ? 'Cancelled orders cannot be modified' : 'Delivered orders are final'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  <OrderItemDisplay item={item} showFullDetails={true} />
                  {index < order.items.length - 1 && <Separator className="my-3" />}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          {order.status !== 'cancelled' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Order Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6">
                  {timeline.map((stage, index) => {
                    const isCompleted = stage.isCompleted(order.status);
                    const isCurrent = stage.isCurrent(order.status);
                    const isLast = index === timeline.length - 1;

                    return (
                      <div key={stage.status} className="relative flex gap-4">
                        {!isLast && (
                          <div
                            className={`absolute left-[15px] top-8 w-0.5 h-full ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}

                        <div className="relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                              isCompleted
                                ? 'bg-green-500 border-green-500'
                                : isCurrent
                                ? 'bg-blue-500 border-blue-500 animate-pulse'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : isCurrent ? (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            ) : (
                              <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1 pb-6">
                          <div
                            className={`font-semibold ${
                              isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                            }`}
                          >
                            {stage.label}
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {stage.description}
                          </div>
                          {isCurrent && (
                            <div className="mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Current Status
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancelled Alert */}
          {order.status === 'cancelled' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                This order was cancelled on {formatOrderDate(order.updatedAt)}.
              </AlertDescription>
            </Alert>
          )}

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.shippingAddress && (
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">
                      {order.shippingAddress.fullName}
                    </div>
                  </div>
                </div>
              )}
              {order.shippingAddress?.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">{order.shippingAddress.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className={order.shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                  {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span>{formatPrice(order.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">
                    {order.shippingAddress.fullName}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {formatAddress(order.shippingAddress)}
                  </p>
                  {order.shippingAddress.phone && (
                    <div className="flex items-center gap-2 text-gray-600 pt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.shippingAddress.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Billing Address */}
          {order.billingAddress && order.billingAddress.id !== order.shippingAddress?.id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-900">
                    {order.billingAddress.fullName}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {formatAddress(order.billingAddress)}
                  </p>
                  {order.billingAddress.phone && (
                    <div className="flex items-center gap-2 text-gray-600 pt-1">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{order.billingAddress.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                      order.paymentMethod === 'jazzcash' ? 'JazzCash' :
                        order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-base text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDeleteDialog(true)}
                disabled={order.status !== 'cancelled'}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Order
              </Button>
              {order.status !== 'cancelled' && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Only cancelled orders can be deleted
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order #{orderNumber}? This action cannot be undone.
              All order data will be permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}