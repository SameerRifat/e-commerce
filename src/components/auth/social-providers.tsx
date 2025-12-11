// src/components/auth/social-providers.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

type Props = { variant?: "sign-in" | "sign-up" };

export default function SocialProviders({ variant = "sign-in" }: Props) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSocialAuth = async (provider: "google" | "apple") => {
    const setLoading = provider === "google" ? setIsGoogleLoading : setIsAppleLoading;

    try {
      setLoading(true);

      // Store guest session token in localStorage before OAuth redirect
      // This will be used after OAuth callback to merge guest cart
      const guestSessionCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("guest_session="));

      if (guestSessionCookie) {
        const guestSessionToken = guestSessionCookie.split("=")[1];
        localStorage.setItem("pending_guest_cart_merge", guestSessionToken);
      }

      // Trigger OAuth flow with Better Auth
      await authClient.signIn.social({
        provider,
        callbackURL: redirectTo,
      });
    } catch (error) {
      console.error(`${provider} authentication error:`, error);

      const errorMessage = error instanceof Error
        ? error.message
        : `Failed to ${variant === "sign-in" ? "sign in" : "sign up"} with ${provider === "google" ? "Google" : "Apple"}. Please try again.`;

      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => handleSocialAuth("google");
  const handleAppleAuth = () => handleSocialAuth("apple");

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-light-300 bg-light-100 px-4 py-3 text-body-medium text-dark-900 hover:bg-light-200 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
        onClick={handleGoogleAuth}
        disabled={isGoogleLoading || isAppleLoading}
        aria-label={`${
          variant === "sign-in" ? "Continue" : "Sign up"
        } with Google`}
      >
        <Image src="/google.svg" alt="" width={18} height={18} />
        <span>{isGoogleLoading ? "Redirecting..." : "Continue with Google"}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-light-300 bg-light-100 px-4 py-3 text-body-medium text-dark-900 hover:bg-light-200 focus:outline-none focus:ring-2 focus:ring-dark-900/10"
        onClick={handleAppleAuth}
        disabled={isGoogleLoading || isAppleLoading}
        aria-label={`${
          variant === "sign-in" ? "Continue" : "Sign up"
        } with Apple`}
      >
        <Image src="/apple.svg" alt="" width={18} height={18} />
        <span>{isAppleLoading ? "Redirecting..." : "Continue with Apple"}</span>
      </Button>
    </div>
  );
}