// src/lib/actions/checkout.ts
"use server";

import { db } from "@/lib/db";
import { getCart } from "./cart";
import { getCurrentUser } from "@/lib/auth/actions";
import { getUserAddresses, getDefaultAddresses } from "./address-management";
import { 
  calculateOrderTotals, 
  validateCartForCheckout, 
  validateCheckoutData,
  type CheckoutData,
  type OrderCalculation 
} from "@/lib/utils/order-helpers";
import { revalidatePath } from "next/cache";

// Checkout session interface
export interface CheckoutSession {
  id: string;
  cartItems: any[];
  calculation: OrderCalculation;
  userAddresses: any[];
  defaultAddresses: {
    shipping: any;
    billing: any;
  };
  expiresAt: Date;
}

// In-memory store for checkout sessions (in production, use Redis or database)
const checkoutSessions = new Map<string, CheckoutSession>();

// Create a checkout session
export async function createCheckoutSession(addressData?: CheckoutData): Promise<{
  success: boolean;
  session?: CheckoutSession;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required. Please sign in to continue.",
      };
    }

    // Get cart data
    const cartData = await getCart();
    if (!cartData.items.length) {
      return {
        success: false,
        error: "Your cart is empty. Please add items before checkout.",
      };
    }

    // Validate cart
    const cartValidation = validateCartForCheckout(cartData.items);
    if (!cartValidation.isValid) {
      return {
        success: false,
        error: cartValidation.errors.join(", "),
      };
    }

    // Calculate totals
    const calculation = calculateOrderTotals(cartData.items);

    // Get user addresses
    const userAddresses = await getUserAddresses();
    const defaultAddresses = await getDefaultAddresses();

    // If address data is provided, validate it
    if (addressData) {
      const addressValidation = validateCheckoutData(addressData);
      if (!addressValidation.isValid) {
        return {
          success: false,
          error: addressValidation.errors.join(", "),
        };
      }
    }

    // Create checkout session
    const sessionId = `checkout_${user.id}_${Date.now()}`;
    const session: CheckoutSession = {
      id: sessionId,
      cartItems: cartData.items,
      calculation,
      userAddresses,
      defaultAddresses,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };

    // Store session
    checkoutSessions.set(sessionId, session);

    // Clean up expired sessions
    cleanupExpiredSessions();

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: "Failed to create checkout session. Please try again.",
    };
  }
}

// Get checkout session
export async function getCheckoutSession(sessionId: string): Promise<{
  success: boolean;
  session?: CheckoutSession;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const session = checkoutSessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: "Checkout session not found or expired.",
      };
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      checkoutSessions.delete(sessionId);
      return {
        success: false,
        error: "Checkout session has expired. Please start over.",
      };
    }

    // Verify session belongs to current user
    if (!session.id.startsWith(`checkout_${user.id}_`)) {
      return {
        success: false,
        error: "Invalid checkout session.",
      };
    }

    return {
      success: true,
      session,
    };
  } catch (error) {
    console.error("Error getting checkout session:", error);
    return {
      success: false,
      error: "Failed to get checkout session.",
    };
  }
}

// Update checkout session with address data
export async function updateCheckoutSession(
  sessionId: string,
  addressData: CheckoutData
): Promise<{
  success: boolean;
  session?: CheckoutSession;
  error?: string;
}> {
  try {
    const sessionResult = await getCheckoutSession(sessionId);
    if (!sessionResult.success || !sessionResult.session) {
      return sessionResult;
    }

    const session = sessionResult.session;

    // Validate address data
    const addressValidation = validateCheckoutData(addressData);
    if (!addressValidation.isValid) {
      return {
        success: false,
        error: addressValidation.errors.join(", "),
      };
    }

    // Verify addresses belong to user
    const userAddresses = await getUserAddresses();
    const addressIds = userAddresses.map(addr => addr.id);

    if (addressData.shippingAddressId && !addressIds.includes(addressData.shippingAddressId)) {
      return {
        success: false,
        error: "Invalid shipping address.",
      };
    }

    if (addressData.billingAddressId && !addressIds.includes(addressData.billingAddressId)) {
      return {
        success: false,
        error: "Invalid billing address.",
      };
    }

    // Update session (in a real app, you'd update the stored session)
    // For now, we'll just return the updated data
    const updatedSession: CheckoutSession = {
      ...session,
      // Add address data to session (you might want to store this separately)
    };

    return {
      success: true,
      session: updatedSession,
    };
  } catch (error) {
    console.error("Error updating checkout session:", error);
    return {
      success: false,
      error: "Failed to update checkout session.",
    };
  }
}

// Process order from checkout session
export async function processOrder(
  sessionId: string,
  finalCheckoutData: CheckoutData
): Promise<{
  success: boolean;
  orderId?: string;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    // Get and validate session
    const sessionResult = await getCheckoutSession(sessionId);
    if (!sessionResult.success || !sessionResult.session) {
      return sessionResult;
    }

    const session = sessionResult.session;

    // Validate final checkout data
    const addressValidation = validateCheckoutData(finalCheckoutData);
    if (!addressValidation.isValid) {
      return {
        success: false,
        error: addressValidation.errors.join(", "),
      };
    }

    // Verify addresses belong to user
    const userAddresses = await getUserAddresses();
    const addressIds = userAddresses.map(addr => addr.id);

    if (!addressIds.includes(finalCheckoutData.shippingAddressId!)) {
      return {
        success: false,
        error: "Invalid shipping address.",
      };
    }

    if (!finalCheckoutData.useSameAddress && 
        finalCheckoutData.billingAddressId && 
        !addressIds.includes(finalCheckoutData.billingAddressId)) {
      return {
        success: false,
        error: "Invalid billing address.",
      };
    }

    // Re-validate cart (items might have changed)
    const cartValidation = validateCartForCheckout(session.cartItems);
    if (!cartValidation.isValid) {
      return {
        success: false,
        error: cartValidation.errors.join(", "),
      };
    }

    // Import order creation function (we'll create this next)
    const { createOrder } = await import("./orders");
    
    // Create order
    const orderResult = await createOrder({
      cartItems: session.cartItems,
      calculation: session.calculation,
      checkoutData: finalCheckoutData,
      userId: user.id,
    });

    if (!orderResult.success) {
      return {
        success: false,
        error: orderResult.error || "Failed to create order.",
      };
    }

    // Clear checkout session
    checkoutSessions.delete(sessionId);

    // Revalidate cart and orders pages
    revalidatePath("/cart");
    revalidatePath("/profile/orders");
    revalidatePath("/checkout");

    return {
      success: true,
      orderId: orderResult.orderId,
    };
  } catch (error) {
    console.error("Error processing order:", error);
    return {
      success: false,
      error: "Failed to process order. Please try again.",
    };
  }
}

// Clean up expired checkout sessions
function cleanupExpiredSessions(): void {
  const now = new Date();
  for (const [sessionId, session] of checkoutSessions.entries()) {
    if (session.expiresAt < now) {
      checkoutSessions.delete(sessionId);
    }
  }
}

// Delete checkout session
export async function deleteCheckoutSession(sessionId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const session = checkoutSessions.get(sessionId);
    if (session && session.id.startsWith(`checkout_${user.id}_`)) {
      checkoutSessions.delete(sessionId);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting checkout session:", error);
    return {
      success: false,
      error: "Failed to delete checkout session.",
    };
  }
}
