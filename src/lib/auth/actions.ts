// src/lib/auth/actions.ts
"use server";

import { cookies, headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guests } from "@/lib/db/schema/index";
import { and, eq, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  secure: true as const,
  sameSite: "strict" as const,
  path: "/" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const emailSchema = z.string().email();
const passwordSchema = z.string().min(8).max(128);
const nameSchema = z.string().min(1).max(100);

export async function createGuestSession() {
  const cookieStore = await cookies();
  const existing = cookieStore.get("guest_session");
  if (existing?.value) {
    return { ok: true, sessionToken: existing.value };
  }

  const sessionToken = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + COOKIE_OPTIONS.maxAge * 1000);

  await db.insert(guests).values({
    sessionToken,
    expiresAt,
  });

  cookieStore.set("guest_session", sessionToken, COOKIE_OPTIONS);
  return { ok: true, sessionToken };
}

export async function guestSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("guest_session")?.value;
  if (!token) {
    return { sessionToken: null };
  }
  const now = new Date();
  await db
    .delete(guests)
    .where(and(eq(guests.sessionToken, token), lt(guests.expiresAt, now)));

  return { sessionToken: token };
}

const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export async function signUp(formData: FormData) {
  const rawData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const data = signUpSchema.parse(rawData);

  // Store guest session token before signup for cart merging
  const cookieStore = await cookies();
  const guestSessionToken = cookieStore.get("guest_session")?.value;

  const res = await auth.api.signUpEmail({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
  });

  // Merge guest cart with new user account
  if (guestSessionToken && res.user?.id) {
    const { mergeGuestCartWithUserCart } = await import('@/lib/actions/cart');
    await mergeGuestCartWithUserCart(res.user.id, guestSessionToken);
  }

  await migrateGuestToUser();
  
  // Return appropriate message based on email verification
  return { 
    ok: true, 
    userId: res.user?.id,
    message: "Please check your email to verify your account."
  };
}

const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function signIn(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const data = signInSchema.parse(rawData);

  // Store guest session token before signin for cart merging
  const cookieStore = await cookies();
  const guestSessionToken = cookieStore.get("guest_session")?.value;

  try {
    const res = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
      },
    });

    // Merge guest cart with existing user account
    if (guestSessionToken && res.user?.id) {
      const { mergeGuestCartWithUserCart } = await import('@/lib/actions/cart');
      await mergeGuestCartWithUserCart(res.user.id, guestSessionToken);
    }

    await migrateGuestToUser();
    return { ok: true, userId: res.user?.id };
  } catch (error: any) {
    // Handle email verification error
    if (error.message?.includes("email") && error.message?.includes("verify")) {
      throw new Error("Please verify your email before signing in. Check your inbox for the verification link.");
    }
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    return session?.user ?? null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

export async function signOut() {
  await auth.api.signOut({ headers: {} });
  return { ok: true };
}

export async function resendVerificationEmail(email: string) {
  try {
    await auth.api.sendVerificationEmail({
      body: { email },
    });
    return { ok: true, message: "Verification email sent!" };
  } catch (error) {
    console.error("Error resending verification email:", error);
    return { ok: false, message: "Failed to send verification email" };
  }
}

// ========== PASSWORD RESET ACTIONS ==========

export async function requestPasswordReset(email: string) {
  try {
    // Validate email format
    emailSchema.parse(email);

    // Get the app URL from environment or default to localhost
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    await auth.api.forgetPassword({
      body: {
        email,
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    // Always return success to prevent email enumeration attacks
    return { 
      ok: true, 
      message: "If an account exists with this email, you will receive a password reset link." 
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    
    // Don't reveal whether the email exists or not for security
    return { 
      ok: true, 
      message: "If an account exists with this email, you will receive a password reset link." 
    };
  }
}

export async function resetPassword(newPassword: string, token: string) {
  try {
    // Validate password
    passwordSchema.parse(newPassword);

    if (!token) {
      return { ok: false, message: "Invalid reset token" };
    }

    await auth.api.resetPassword({
      body: {
        newPassword,
        token,
      },
    });

    return { 
      ok: true, 
      message: "Password reset successfully!" 
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    
    // Check for specific error messages
    if (error.message?.includes("token") || error.message?.includes("expired")) {
      return { 
        ok: false, 
        message: "This reset link has expired or is invalid. Please request a new one." 
      };
    }

    return { 
      ok: false, 
      message: "Failed to reset password. Please try again." 
    };
  }
}

export async function mergeGuestCartWithUserCart() {
  await migrateGuestToUser();
  return { ok: true };
}

async function migrateGuestToUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("guest_session")?.value;
  if (!token) return;

  await db.delete(guests).where(eq(guests.sessionToken, token));
  cookieStore.delete("guest_session");
}

// Admin actions
export async function checkIsAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  
  return session?.user?.role === "admin";
}