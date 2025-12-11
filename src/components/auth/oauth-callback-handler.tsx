"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/client";

/**
 * Handles guest cart migration after OAuth authentication.
 *
 * When a user signs in via OAuth (Google/Apple), they are redirected away and back.
 * Before the redirect, we store their guest session token in localStorage.
 * After they return authenticated, this component merges their guest cart with their account.
 */
export default function OAuthCallbackHandler() {
  const { data: session, isPending } = useSession();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Only run once and when session is loaded
    if (isPending || hasProcessed.current) return;

    const processPendingCartMerge = async () => {
      const pendingGuestToken = localStorage.getItem("pending_guest_cart_merge");

      // If user is authenticated and there's a pending cart merge
      if (session?.user && pendingGuestToken) {
        hasProcessed.current = true;

        try {
          // Dynamically import to avoid circular dependencies
          const { mergeGuestCartWithUserCart } = await import("@/lib/actions/cart");

          // Merge the guest cart with the user's cart
          await mergeGuestCartWithUserCart(session.user.id, pendingGuestToken);

          // Clean up localStorage
          localStorage.removeItem("pending_guest_cart_merge");
        } catch (error) {
          console.error("Failed to merge guest cart after OAuth:", error);
          // Still remove the token even if merge fails to avoid infinite retries
          localStorage.removeItem("pending_guest_cart_merge");
        }
      }
    };

    processPendingCartMerge();
  }, [session, isPending]);

  return null; // This component doesn't render anything
}
