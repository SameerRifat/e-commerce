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
import { OrderWithDetails } from '@/lib/actions/orders';
import {
    formatPrice,
    generateOrderNumber,
    estimateDeliveryDate,
    ORDER_STATUS_LABELS,
    ORDER_STATUS_COLORS,
    ORDER_STATUS_DESCRIPTIONS,
    getOrderTimeline,
    getNextAction,
} from '@/lib/utils/order-helpers';
import { OrderItemDisplay } from './order-item-display';
import { OrderActions } from './order-actions';

interface OrderDetailClientProps {
    order: OrderWithDetails;
}

export const OrderDetailClient = ({ order: initialOrder }: OrderDetailClientProps) => { 
    console.log('initialOrder: ', JSON.stringify(initialOrder, null, 2));
    const [order, setOrder] = useState<OrderWithDetails>(initialOrder);
    const [isLoading, setIsLoading] = useState(false);

    const orderNumber = generateOrderNumber(order.id);
    const estimatedDelivery = estimateDeliveryDate(order.createdAt, order.status);
    const timeline = getOrderTimeline(order.paymentMethod);
    const nextAction = getNextAction(order.status, order.paymentMethod);

    const getStatusIcon = (status: string) => {
        const icons: Record<string, any> = {
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
        } catch (error) {
            toast.error('An unexpected error occurred');
            console.error('Cancel order error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorder = async (order: OrderWithDetails) => {
        try {
            toast.success('Items added to cart');
        } catch (error) {
            toast.error('Failed to add items to cart');
        }
    };

    const StatusIcon = getStatusIcon(order.status);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Success Header - Cleaner Design */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <StatusIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Order #{orderNumber}
                                    </h1>
                                    <Badge className={`${ORDER_STATUS_COLORS[order.status]} border`}>
                                        {ORDER_STATUS_LABELS[order.status]}
                                    </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Placed on {formatOrderDate(order.createdAt)}</span>
                                    </div>
                                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                                        <div className="flex items-center gap-2 text-green-700">
                                            <Truck className="w-4 h-4" />
                                            <span>Estimated delivery: {estimatedDelivery.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground mb-1">Order Total</div>
                            <div className="text-2xl font-bold">{formatPrice(order.totalAmount)}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* What's Next Alert */}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                        <strong>What&apos;s Next:</strong> {nextAction}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-lg">
                                    <Package className="w-5 h-5" />
                                    Items in Your Order
                                </span>
                                <span className="text-sm font-normal text-muted-foreground">
                                    {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            {order.items.map((item, index) => (
                                <div key={item.id}>
                                    <OrderItemDisplay item={item} showFullDetails={true} />
                                    {index < order.items.length - 1 && <Separator className="my-3" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Order Timeline - Enhanced */}
                    {order.status !== 'cancelled' && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Order Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="relative space-y-6">
                                    {timeline.map((stage, index) => {
                                        const isCompleted = stage.isCompleted(order.status);
                                        const isCurrent = stage.isCurrent(order.status);
                                        const isLast = index === timeline.length - 1;

                                        return (
                                            <div key={stage.status} className="relative flex gap-4">
                                                {/* Timeline Line */}
                                                {!isLast && (
                                                    <div
                                                        className={`absolute left-[15px] top-8 w-0.5 h-full ${
                                                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                        }`}
                                                    />
                                                )}

                                                {/* Status Indicator */}
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

                                                {/* Stage Info */}
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

                    {/* Cancelled Timeline */}
                    {order.status === 'cancelled' && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    Order Cancelled
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <Alert className="border-red-200 bg-red-50">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-red-900">
                                        This order was cancelled on {formatOrderDate(order.updatedAt)}.
                                        {order.paymentMethod !== 'cod' && ' Any payment made will be refunded within 5-7 business days.'}
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}

                    {/* Order Notes */}
                    {order.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Special Instructions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border">{order.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
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
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
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

                    {/* Billing Address - Only if different */}
                    {order.billingAddress && order.billingAddress.id !== order.shippingAddress?.id && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Billing Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-gray-900">{order.billingAddress.fullName}</p>
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
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
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
                                {order.paymentMethod === 'cod' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        Please keep exact cash ready at delivery
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Actions */}
                    <Card>
                        <CardContent className="pt-6">
                            <OrderActions
                                order={order}
                                onCancel={handleCancelOrder}
                                onReorder={handleReorder}
                                isLoading={isLoading}
                            />

                            <Separator className="my-4" />

                            <Button asChild variant="outline" size="lg" className="w-full">
                                <Link href="/profile/orders">
                                    View All Orders
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Help Section */}
                    <Card className="bg-gray-50">
                        <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                                <Info className="w-5 h-5 text-gray-400 mx-auto" />
                                <p className="text-sm text-gray-600">
                                    Need help with this order?
                                </p>
                                <Button variant="link" size="sm" className="text-primary">
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