// src/lib/utils/inventory-helpers.ts

/**
 * Get inventory status for display in UI
 * Hides exact stock numbers for security and competitive reasons
 */
export function getInventoryStatus(inStock: number): {
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    displayText: string;
    canOrder: boolean;
    badgeColor: string;
} {
    if (inStock === 0) {
        return {
            status: 'out_of_stock',
            displayText: 'Out of Stock',
            canOrder: false,
            badgeColor: 'bg-red-100 text-red-800 border-red-200',
        };
    }

    if (inStock <= 5) {
        return {
            status: 'low_stock',
            displayText: `Only ${inStock} left in stock!`,
            canOrder: true,
            badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
        };
    }

    return {
        status: 'in_stock',
        displayText: 'In Stock',
        canOrder: true,
        badgeColor: 'bg-green-100 text-green-800 border-green-200',
    };
}

/**
 * Check if quantity can be added to cart based on current stock
 */
export function canAddToCart(
    requestedQuantity: number,
    inStock: number,
    currentCartQuantity: number = 0
): {
    canAdd: boolean;
    maxQuantity: number;
    error?: string;
} {
    const totalRequested = requestedQuantity + currentCartQuantity;

    if (inStock === 0) {
        return {
            canAdd: false,
            maxQuantity: 0,
            error: 'This item is out of stock',
        };
    }

    if (totalRequested > inStock) {
        return {
            canAdd: false,
            maxQuantity: inStock - currentCartQuantity,
            error: `Only ${inStock} available. You already have ${currentCartQuantity} in cart.`,
        };
    }

    return {
        canAdd: true,
        maxQuantity: inStock,
    };
}

/**
 * Format stock quantity for admin display
 */
export function formatStockForAdmin(inStock: number): string {
    if (inStock === 0) return '0 (Out of Stock)';
    if (inStock <= 5) return `${inStock} (Low Stock)`;
    return `${inStock}`;
}