// src/lib/utils/order-helpers.ts

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod' | 'jazzcash' | 'easypaisa';

export const PAYMENT_METHODS = {
  cod: {
    name: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    available: true,
  },
  jazzcash: {
    name: 'JazzCash',
    description: 'Mobile wallet payment',
    available: false,
  },
  easypaisa: {
    name: 'EasyPaisa',
    description: 'Mobile wallet payment',
    available: false,
  },
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order Received',
  processing: 'Processing',
  paid: 'Payment Confirmed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-purple-100 text-purple-800 border-purple-200',
  paid: 'bg-green-100 text-green-800 border-green-200',
  shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'We have received your order and will begin processing it soon.',
  processing: 'Your order is being prepared for shipment.',
  paid: 'Payment confirmed. Your order will be processed soon.',
  shipped: 'Your order is on its way to you.',
  out_for_delivery: 'Your order is out for delivery and will arrive today.',
  delivered: 'Your order has been successfully delivered.',
  cancelled: 'This order has been cancelled.',
};

export interface TimelineStage {
  status: OrderStatus;
  label: string;
  description: string;
  isCompleted: (currentStatus: OrderStatus) => boolean;
  isCurrent: (currentStatus: OrderStatus) => boolean;
}

export function getOrderTimeline(paymentMethod: PaymentMethod): TimelineStage[] {
  // COD orders - payment happens at delivery
  if (paymentMethod === 'cod') {
    return [
      {
        status: 'pending',
        label: 'Order Received',
        description: 'Your order has been placed',
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
  
  // Pre-paid orders (JazzCash, EasyPaisa)
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
}

// Format price for display
export function formatPrice(price: number): string {
  return `Rs.${price.toLocaleString('en-PK', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`;
}

// Generate order number from order ID
export function generateOrderNumber(orderId: string): string {
  return orderId.substring(0, 8).toUpperCase();
}

// Estimate delivery date based on order date and status
export function estimateDeliveryDate(orderDate: Date, status: OrderStatus): Date {
  const deliveryDate = new Date(orderDate);
  
  if (status === 'delivered') {
    return orderDate; // Already delivered
  }
  
  if (status === 'shipped' || status === 'out_for_delivery') {
    deliveryDate.setDate(deliveryDate.getDate() + 2); // 2 days
  } else {
    deliveryDate.setDate(deliveryDate.getDate() + 5); // 5 business days
  }
  
  return deliveryDate;
}

// Get next action message for customer
export function getNextAction(status: OrderStatus, paymentMethod: PaymentMethod): string {
  if (status === 'cancelled') {
    return 'This order was cancelled.';
  }
  
  if (status === 'delivered') {
    return 'Your order has been delivered. Thank you for shopping with us!';
  }
  
  const actions: Record<OrderStatus, string> = {
    pending: 'We will confirm your order within 24 hours.',
    processing: 'Your order is being packed and will ship soon.',
    paid: 'Your payment is confirmed. Order will be processed shortly.',
    shipped: 'Track your package. Expected delivery in 2-3 business days.',
    out_for_delivery: paymentMethod === 'cod' 
      ? 'Your order will be delivered today. Please keep cash ready.' 
      : 'Your order will be delivered today.',
    delivered: '',
    cancelled: '',
  };
  
  return actions[status] || 'Your order is being processed.';
}

// Calculate shipping cost based on subtotal
export function calculateShipping(subtotal: number): number {
  return subtotal >= 2500 ? 0 : 250; // Free shipping over Rs.2,500
}

// Calculate tax amount
export function calculateTax(subtotal: number, taxRate: number = 0.1): number {
  return Math.round(subtotal * taxRate);
}

// Calculate order totals
export function calculateOrderTotal(
  subtotal: number,
  shippingCost?: number,
  taxAmount?: number
): number {
  const shipping = shippingCost ?? calculateShipping(subtotal);
  const tax = taxAmount ?? calculateTax(subtotal);
  return subtotal + shipping + tax;
}