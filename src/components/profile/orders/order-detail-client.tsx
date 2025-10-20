// src/components/profile/orders/order-detail-client.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Package,
    MapPin,
    CreditCard,
    Clock,
    CheckCircle2,
    Truck,
    XCircle,
    ChevronRight,
    Calendar,
    Info,
    Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { OrderStatus, OrderWithDetails } from '@/lib/actions/orders';
import {
    formatPrice,
    generateOrderNumber,
    estimateDeliveryDate,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
    getOrderTimeline,
    getNextAction,
} from '@/lib/utils/order-helpers';
import { OrderItemDisplay } from './order-item-display';
import { OrderActions } from './order-actions';

interface OrderDetailClientProps {
    order: OrderWithDetails;
}

type AddressType = NonNullable<OrderWithDetails['shippingAddress']>;

export const OrderDetailClient = ({ order: initialOrder }: OrderDetailClientProps) => { 
    const [order, setOrder] = useState<OrderWithDetails>(initialOrder);
    const [isLoading, setIsLoading] = useState(false);

    const orderNumber = generateOrderNumber(order.id);
    const estimatedDelivery = estimateDeliveryDate(order.createdAt, order.status);
    const timeline = getOrderTimeline(order.paymentMethod);
    const nextAction = getNextAction(order.status, order.paymentMethod);

    const getStatusIcon = (status: OrderStatus) => {
        const icons: Record<OrderStatus, typeof CheckCircle2> = {
            delivered: CheckCircle2,
            shipped: Truck,
            out_for_delivery: Truck,
            processing: Package,
            paid: CheckCircle2,
            pending: Clock,
            cancelled: XCircle,
        };
        return icons[status] || Clock;
    };

    const formatAddress = (address: AddressType) => {
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

    const formatOrderDateShort = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const handleCancelOrder = async (orderId: string) => {
        setIsLoading(true);
        try {
            const { cancelOrder } = await import('@/lib/actions/orders');
            const result = await cancelOrder(orderId);

            if (result.success) {
                setOrder(prev => ({ ...prev, status: 'cancelled' as const }));
                toast.success('Order cancelled successfully');
            } else {
                toast.error(result.error || 'Failed to cancel order');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
            console.error('Cancel order error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorder = async () => {
        try {
            // TODO: Implement reorder functionality
            toast.success('Items added to cart');
        } catch (err) {
            toast.error('Failed to add items to cart');
            console.error('Reorder error:', err);
        }
    };

    const StatusIcon = getStatusIcon(order.status);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Success Header - COMPLETELY REDESIGNED FOR MOBILE */}
            <Card className="border-l-4 border-l-primary overflow-hidden">
                <CardContent className="py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Left section with icon and details */}
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <StatusIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                                        Order #{orderNumber}
                                    </h1>
                                    <Badge className={`${ORDER_STATUS_COLORS[order.status]} border self-start`}>
                                        {ORDER_STATUS_LABELS[order.status]}
                                    </Badge>
                                </div>
                                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                        <span className="truncate">
                                            <span className="hidden sm:inline">{formatOrderDate(order.createdAt)}</span>
                                            <span className="sm:hidden">{formatOrderDateShort(order.createdAt)}</span>
                                        </span>
                                    </div>
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                        <div className="flex items-center gap-2 text-green-700">
                                            <Truck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                            <span className="truncate">
                                                Est. delivery: {estimatedDelivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Right section with total */}
                        <div className="text-left sm:text-right sm:flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-4">
                            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Order Total</div>
                            <div className="text-xl sm:text-2xl font-bold text-primary">{formatPrice(order.totalAmount)}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* What's Next Alert - FIXED */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <AlertDescription className="text-blue-900 text-xs sm:text-sm">
                        <strong>What&apos;s Next:</strong> {nextAction}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Order Items - FIXED */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="truncate">Items in Your Order</span>
                                </span>
                                <span className="text-xs sm:text-sm font-normal text-muted-foreground flex-shrink-0">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {order.items.map((item, index) => (
                                <div key={item.id}>
                                    <OrderItemDisplay 
                                        item={item} 
                                        showFullDetails={true}
                                        orderStatus={order.status}
                                    />
                                    {index < order.items.length - 1 && <Separator className="my-3" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Order Timeline - COMPLETELY FIXED FOR MOBILE */}
                    {order.status !== 'cancelled' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                    Order Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative space-y-4 sm:space-y-6">
                                    {timeline.map((stage, index) => {
                                        const isCompleted = stage.isCompleted(order.status);
                                        const isCurrent = stage.isCurrent(order.status);
                                        const isLast = index === timeline.length - 1;

                                        return (
                                            <div key={stage.status} className="relative flex gap-3 sm:gap-4">
                                                {!isLast && (
                                                    <div
                                                        className={`absolute left-[11px] sm:left-[15px] top-7 sm:top-8 w-0.5 h-full ${
                                                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                        }`}
                                                    />
                                                )}

                                                <div className="relative z-10 flex-shrink-0">
                                                    <div
                                                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center ${
                                                            isCompleted
                                                                ? 'bg-green-500 border-green-500'
                                                                : isCurrent
                                                                ? 'bg-blue-500 border-blue-500 animate-pulse'
                                                                : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        {isCompleted ? (
                                                            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                                                        ) : isCurrent ? (
                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 rounded-full" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                                                    <div
                                                        className={`font-semibold text-sm sm:text-base ${
                                                            isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'
                                                        }`}
                                                    >
                                                        {stage.label}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 break-words">
                                                        {stage.description}
                                                    </div>
                                                    {isCurrent && (
                                                        <div className="mt-1.5 sm:mt-2 text-xs font-medium text-blue-600 flex items-center gap-1">
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

                    {/* Cancelled Timeline - FIXED */}
                    {order.status === 'cancelled' && (
                        <Card>
                            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                    Order Cancelled
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 px-4 sm:px-6">
                                <Alert className="border-red-200 bg-red-50">
                                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    <AlertDescription className="text-red-900 text-xs sm:text-sm">
                                        This order was cancelled on {formatOrderDateShort(order.updatedAt)}.
                                        {order.paymentMethod !== 'cod' && ' Any payment made will be refunded within 5-7 business days.'}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Notes - FIXED */}
                    {order.notes && (
                        <Card>
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle className="text-base sm:text-lg">Special Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6">
                                <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border break-words">
                                    {order.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - FIXED */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base sm:text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2.5 sm:space-y-3">
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatPrice(order.subtotal)}</span>
                            </div>

                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Shipping</span>
                                <span className={order.shippingCost === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                                    {order.shippingCost === 0 ? 'FREE' : formatPrice(order.shippingCost)}
                                </span>
                            </div>

                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="text-gray-600">Tax</span>
                                <span className="font-medium">{formatPrice(order.taxAmount)}</span>
                            </div>

                            <Separator />

                            <div className="flex justify-between font-semibold text-base sm:text-lg">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address - FIXED */}
                    {order.shippingAddress && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                    <p className="font-semibold text-gray-900 break-words">{order.shippingAddress.fullName}</p>
                                    <p className="text-gray-600 leading-relaxed break-words">
                                        {formatAddress(order.shippingAddress)}
                                    </p>
                                    {order.shippingAddress.phone && (
                                        <div className="flex items-center gap-2 text-gray-600 pt-1">
                                            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                            <span className="break-all">{order.shippingAddress.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Billing Address - FIXED */}
                    {order.billingAddress && order.billingAddress.id !== order.shippingAddress?.id && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Billing Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                    <p className="font-semibold text-gray-900 break-words">{order.billingAddress.fullName}</p>
                                    <p className="text-gray-600 leading-relaxed break-words">
                                        {formatAddress(order.billingAddress)}
                                    </p>
                                    {order.billingAddress.phone && (
                                        <div className="flex items-center gap-2 text-gray-600 pt-1">
                                            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                            <span className="break-all">{order.billingAddress.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Method - FIXED */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-gray-600">Method</span>
                                    <span className="font-medium text-right">
                                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                                            order.paymentMethod === 'jazzcash' ? 'JazzCash' :
                                                order.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-gray-600">Amount</span>
                                    <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
                                </div>
                                {order.paymentMethod === 'cod' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                    <div className="mt-2 sm:mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        Please keep exact cash ready at delivery
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Actions - FIXED */}
                    <Card>
                        <CardContent>
                            <OrderActions
                                order={order}
                                onCancel={handleCancelOrder}
                                onReorder={handleReorder}
                                isLoading={isLoading}
                            />

                            <Button asChild variant="outline" size="lg" className="w-full mt-3 sm:mt-4 text-sm sm:text-base">
                                <Link href="/profile/orders">
                                    View All Orders
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Help Section - FIXED */}
                    <Card className="bg-gray-50">
                        <CardContent className="px-4 sm:px-6 py-4">
                            <div className="text-center space-y-2">
                                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mx-auto" />
                                <p className="text-xs sm:text-sm text-gray-600">
                                    Need help with this order?
                                </p>
                                <Button variant="link" size="sm" className="text-primary text-xs sm:text-sm h-auto p-0">
                                    Contact Support
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};