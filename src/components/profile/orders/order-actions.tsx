// src/components/profile/orders/order-actions.tsx

import { Button } from '@/components/ui/button';
import {
    RefreshCw,
    XCircle,
    Star,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { OrderWithDetails } from '@/lib/actions/orders';

interface OrderActionsProps {
    order: OrderWithDetails;
    onCancel: (orderId: string) => Promise<void>;
    onReorder: (order: OrderWithDetails) => Promise<void>;
    isLoading: boolean;
}

export const OrderActions = ({
    order,
    onCancel,
    onReorder,
    isLoading
}: OrderActionsProps) => {
    const canCancel = order.status === 'pending' && !isLoading;
    const canReorder = ['delivered', 'cancelled'].includes(order.status) && !isLoading;
    const canReview = order.status === 'delivered' && !isLoading;

    // Don't render actions section if no actions are available
    if (!canCancel && !canReorder && !canReview) {
        return null;
    }

    return (
        <div className="flex gap-2 pt-4 border-t flex-wrap">
            {/* Cancel Order */}
            {canCancel && (
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onCancel(order.id)}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Cancel Order
                </Button>
            )}

            {/* Write Review */}
            {canReview && (
                <Button variant="outline" size="sm">
                    <Star className="w-4 h-4 mr-2" />
                    Write Review
                </Button>
            )}

            {/* Reorder */}
            {canReorder && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReorder(order)}
                    disabled={isLoading}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Buy Again
                </Button>
            )}

            {/* Contextual Help Text */}
            {order.status === 'pending' && (
                <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    <span>You can cancel pending orders</span>
                </div>
            )}
        </div>
    );
};