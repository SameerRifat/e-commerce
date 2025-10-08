// src/lib/utils/order-helpers.ts
import { CartItemWithDetails } from "@/lib/actions/cart";

export interface OrderCalculation {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}

export interface CheckoutData {
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentMethod: 'cod' | 'jazzcash' | 'easypaisa';
  notes?: string;
  useSameAddress: boolean;
}

// Calculate order totals including shipping and tax
export function calculateOrderTotals(
  cartItems: CartItemWithDetails[],
  shippingCost: number = 250,
  taxRate: number = 0.1
): OrderCalculation {
  const subtotal = cartItems.reduce((sum, item) => {
    if (item.isSimpleProduct && item.product) {
      const price = item.product.salePrice ? parseFloat(item.product.salePrice) : parseFloat(item.product.price);
      return sum + (price * item.quantity);
    } else if (!item.isSimpleProduct && item.variant) {
      const price = item.variant.salePrice ? parseFloat(item.variant.salePrice) : parseFloat(item.variant.price);
      return sum + (price * item.quantity);
    }
    return sum;
  }, 0);

  // Free shipping over Rs.2,500
  const finalShippingCost = subtotal >= 2500 ? 0 : shippingCost;
  const taxAmount = Math.round(subtotal * taxRate);
  const totalAmount = subtotal + finalShippingCost + taxAmount;

  return {
    subtotal,
    shippingCost: finalShippingCost,
    taxAmount,
    totalAmount,
  };
}

// Validate cart items for checkout
export function validateCartForCheckout(cartItems: CartItemWithDetails[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!cartItems || cartItems.length === 0) {
    errors.push('Your cart is empty');
    return { isValid: false, errors };
  }

  // Check stock availability
  for (const item of cartItems) {
    if (item.isSimpleProduct && item.product) {
      if (item.product.inStock < item.quantity) {
        errors.push(`${item.product.name} is out of stock`);
      }
    } else if (!item.isSimpleProduct && item.variant) {
      if (item.variant.inStock < item.quantity) {
        errors.push(`${item.variant.product.name} (${item.variant.color?.name || ''} ${item.variant.size?.name || ''}) is out of stock`);
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Validate checkout data
export function validateCheckoutData(data: CheckoutData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.shippingAddressId) {
    errors.push('Shipping address is required');
  }

  if (!data.useSameAddress && !data.billingAddressId) {
    errors.push('Billing address is required');
  }

  if (!['cod', 'jazzcash', 'easypaisa'].includes(data.paymentMethod)) {
    errors.push('Invalid payment method');
  }

  return { isValid: errors.length === 0, errors };
}

// Format price for display
export function formatPrice(price: number): string {
  return `Rs.${price.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Generate order number from order ID
export function generateOrderNumber(orderId: string): string {
  // Take first 8 characters and make them uppercase
  return orderId.substring(0, 8).toUpperCase();
}

// Estimate delivery date based on order status and date
export function estimateDeliveryDate(orderDate?: Date, status?: string): Date {
  const baseDate = orderDate ? new Date(orderDate) : new Date();
  const deliveryDate = new Date(baseDate);
  
  // Adjust based on status
  if (status === 'delivered') {
    return baseDate; // Already delivered
  } else if (status === 'shipped' || status === 'out_for_delivery') {
    deliveryDate.setDate(deliveryDate.getDate() + 2); // 2 days for shipped orders
  } else {
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days default
  }
  
  return deliveryDate;
}

// Payment method display names
export const PAYMENT_METHODS = {
  cod: {
    name: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    icon: '💰',
    available: true,
  },
  jazzcash: {
    name: 'JazzCash',
    description: 'Mobile wallet payment',
    icon: '📱',
    available: false,
  },
  easypaisa: {
    name: 'EasyPaisa',
    description: 'Mobile wallet payment',
    icon: '💳',
    available: false,
  },
} as const;

// IMPROVED: Better order status labels aligned with e-commerce standards
export const ORDER_STATUS_LABELS = {
  pending: 'Order Received',        // Changed from "Order Placed"
  processing: 'Processing',         // NEW: Clear "we're working on it" status
  paid: 'Payment Confirmed',        // Keep for pre-paid orders
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',  // NEW: Final delivery stage
  delivered: 'Delivered',
  cancelled: 'Cancelled',
} as const;

// Order status colors
export const ORDER_STATUS_COLORS = {
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
} as const;

// IMPROVED: Order status descriptions for customers
export const ORDER_STATUS_DESCRIPTIONS = {
  pending: 'We have received your order and will begin processing it soon.',
  processing: 'Your order is being prepared for shipment.',
  paid: 'Payment has been confirmed. Your order will be processed soon.',
  shipped: 'Your order is on its way to you.',
  out_for_delivery: 'Your order is out for delivery and will arrive today.',
  delivered: 'Your order has been successfully delivered.',
  cancelled: 'This order has been cancelled.',
} as const;

// IMPROVED: Timeline stages for COD orders
export interface TimelineStage {
  status: string;
  label: string;
  description: string;
  isCompleted: (currentStatus: string) => boolean;
  isCurrent: (currentStatus: string) => boolean;
}

export const getOrderTimeline = (paymentMethod: string): TimelineStage[] => {
  // For COD orders - payment happens at delivery
  if (paymentMethod === 'cod') {
    return [
      {
        status: 'pending',
        label: 'Order Received',
        description: 'Your order has been placed successfully',
        isCompleted: (current) => ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(current),
        isCurrent: (current) => current === 'pending',
      },
      {
        status: 'processing',
        label: 'Order Confirmed',
        description: 'Your order is being prepared',
        isCompleted: (current) => ['shipped', 'out_for_delivery', 'delivered'].includes(current),
        isCurrent: (current) => current === 'processing',
      },
      {
        status: 'shipped',
        label: 'Shipped',
        description: 'Your order is on the way',
        isCompleted: (current) => ['out_for_delivery', 'delivered'].includes(current),
        isCurrent: (current) => current === 'shipped',
      },
      {
        status: 'out_for_delivery',
        label: 'Out for Delivery',
        description: 'Your order will arrive today',
        isCompleted: (current) => current === 'delivered',
        isCurrent: (current) => current === 'out_for_delivery',
      },
      {
        status: 'delivered',
        label: 'Delivered & Paid',
        description: 'Order delivered and payment collected',
        isCompleted: (current) => current === 'delivered',
        isCurrent: (current) => current === 'delivered',
      },
    ];
  }
  
  // For pre-paid orders (JazzCash, EasyPaisa)
  return [
    {
      status: 'pending',
      label: 'Order Placed',
      description: 'Your order has been placed',
      isCompleted: (current) => ['paid', 'processing', 'shipped', 'out_for_delivery', 'delivered'].includes(current),
      isCurrent: (current) => current === 'pending',
    },
    {
      status: 'paid',
      label: 'Payment Confirmed',
      description: 'Payment received successfully',
      isCompleted: (current) => ['processing', 'shipped', 'out_for_delivery', 'delivered'].includes(current),
      isCurrent: (current) => current === 'paid',
    },
    {
      status: 'processing',
      label: 'Processing',
      description: 'Your order is being prepared',
      isCompleted: (current) => ['shipped', 'out_for_delivery', 'delivered'].includes(current),
      isCurrent: (current) => current === 'processing',
    },
    {
      status: 'shipped',
      label: 'Shipped',
      description: 'Your order is on the way',
      isCompleted: (current) => ['out_for_delivery', 'delivered'].includes(current),
      isCurrent: (current) => current === 'shipped',
    },
    {
      status: 'out_for_delivery',
      label: 'Out for Delivery',
      description: 'Your order will arrive today',
      isCompleted: (current) => current === 'delivered',
      isCurrent: (current) => current === 'out_for_delivery',
    },
    {
      status: 'delivered',
      label: 'Delivered',
      description: 'Your order has been delivered',
      isCompleted: (current) => current === 'delivered',
      isCurrent: (current) => current === 'delivered',
    },
  ];
};

// Helper to get next expected action for customer
export function getNextAction(status: string, paymentMethod: string): string {
  if (status === 'cancelled') {
    return 'This order was cancelled.';
  }
  
  if (status === 'delivered') {
    return 'Your order has been delivered. Enjoy your purchase!';
  }
  
  const actions: Record<string, string> = {
    pending: 'We will confirm your order within 24 hours.',
    processing: 'Your order is being packed and will ship soon.',
    paid: 'Your order will be processed and shipped soon.',
    shipped: 'Track your package. It will arrive in 2-3 business days.',
    out_for_delivery: 'Your order will be delivered today. Please keep your payment ready.',
  };
  
  return actions[status] || 'Your order is being processed.';
}