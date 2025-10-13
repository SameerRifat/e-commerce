// src/app/(auth)/sign-in/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { signIn } from "@/lib/auth/actions";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSignIn = async (formData: FormData) => {
    try {
      const result = await signIn(formData);

      if (result?.ok) {
        router.push(redirectTo);
        return result;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  return <AuthForm mode="sign-in" onSubmit={handleSignIn} />;
}