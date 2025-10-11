// src/app/(auth)/sign-in/page.tsx
import AuthForm from "@/components/auth/auth-form";
import {signIn} from "@/lib/auth/actions";

export default function Page() {
  return <AuthForm mode="sign-in" onSubmit={signIn} />;
}