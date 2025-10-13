// src/components/dashboard/orders/orders-table.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Eye,
    MoreHorizontal,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package,
    CheckCircle2,
    Clock,
    Truck,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardOrder } from '@/lib/actions/dashboard/orders';
import { updateDashboardOrderStatus, bulkUpdateOrderStatus, deleteOrder } from '@/lib/actions/dashboard/orders';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/utils/order-helpers';
import { formatDate } from '@/lib/utils';

interface OrdersTableProps {
    orders: DashboardOrder[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export function OrdersTable({ orders, pagination }: OrdersTableProps) {
    const router = useRouter();
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

    const formatCurrency = (amount: number) => {
        return `Rs.${amount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
    };

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

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const toggleAllOrders = () => {
        setSelectedOrders(prev =>
            prev.length === orders.length ? [] : orders.map(o => o.id)
        );
    };

    const handleBulkStatusUpdate = async (status: any) => {
        if (selectedOrders.length === 0) return;

        setIsUpdating(true);
        try {
            const result = await bulkUpdateOrderStatus(selectedOrders, status);
            if (result.success) {
                toast.success(result.message);
                setSelectedOrders([]);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update orders');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: any) => {
        setIsUpdating(true);
        try {
            const result = await updateDashboardOrderStatus(orderId, newStatus);
            if (result.success) {
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
        if (!orderToDelete) return;

        try {
            const result = await deleteOrder(orderToDelete);
            if (result.success) {
                toast.success(result.message);
                setOrderToDelete(null);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to delete order');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const goToPage = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set('page', page.toString());
        router.push(`/dashboard/orders?${params.toString()}`);
    };

    if (orders.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                        <p className="text-muted-foreground">
                            No orders match your current filters
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Orders</CardTitle>
                        {selectedOrders.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedOrders.length} selected
                                </span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" disabled={isUpdating}>
                                            Bulk Actions
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('processing')}>
                                            Mark as Processing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('shipped')}>
                                            Mark as Shipped
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('delivered')}>
                                            Mark as Delivered
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => handleBulkStatusUpdate('cancelled')}
                                            className="text-red-600"
                                        >
                                            Cancel Orders
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedOrders.length === orders.length}
                                            onCheckedChange={toggleAllOrders}
                                        />
                                    </TableHead>
                                    <TableHead>Order</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Payment</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const StatusIcon = getStatusIcon(order.status);

                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedOrders.includes(order.id)}
                                                    onCheckedChange={() => toggleOrderSelection(order.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={`/dashboard/orders/${order.id}`}
                                                    className="font-medium hover:underline"
                                                >
                                                    #{order.orderNumber}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{order.customerName}</div>
                                                    {order.customerEmail && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {order.customerEmail}
                                                        </div>
                                                    )}
                                                    {order.shippingAddress && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {order.shippingAddress.city}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]} hover:opacity-80 transition-opacity`}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {ORDER_STATUS_LABELS[order.status]}
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'pending')}>
                                                            Pending
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'processing')}>
                                                            Processing
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'paid')}>
                                                            Paid
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'shipped')}>
                                                            Shipped
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'out_for_delivery')}>
                                                            Out for Delivery
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, 'delivered')}>
                                                            Delivered
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                                                            className="text-red-600"
                                                        >
                                                            Cancelled
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{order.itemCount}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">
                                                    {formatCurrency(order.totalAmount)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(order.createdAt)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/dashboard/orders/${order.id}`}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setOrderToDelete(order.id)}
                                                            className="text-red-600"
                                                            disabled={order.status !== 'cancelled'}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                                {pagination.total} orders
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="text-sm">
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this order? This action cannot be undone.
                            Only cancelled orders can be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOrder}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}