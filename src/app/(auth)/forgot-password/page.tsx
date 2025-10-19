// src/app/(auth)/forgot-password/page.tsx
"use client";

import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { requestPasswordReset } from "@/lib/auth/actions";

export default function ForgotPasswordPage() {
  const handleForgotPassword = async (email: string) => {
    try {
      const result = await requestPasswordReset(email);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return <ForgotPasswordForm onSubmit={handleForgotPassword} />;
}