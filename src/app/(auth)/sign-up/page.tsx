// src/app/(auth)/sign-up/page.tsx
"use client";

import { useRouter } from "next/navigation";
import AuthForm from "@/components/auth/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignUpPage() {
  const router = useRouter();

  const handleSignUp = async (formData: FormData) => {
    try {
      const result = await signUp(formData);

      if (result?.ok) {
        const email = formData.get("email") as string;
        // Redirect to verification pending page
        router.push(`/verification-pending?email=${encodeURIComponent(email)}`);
        return result;
      }

      return result;
    } catch (error) {
      throw error;
    }
  };

  return <AuthForm mode="sign-up" onSubmit={handleSignUp} />;
}