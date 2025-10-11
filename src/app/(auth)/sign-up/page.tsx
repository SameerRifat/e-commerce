// src/app/(auth)/sign-up/page.tsx
import AuthForm from "@/components/auth/auth-form";
import {signUp} from "@/lib/auth/actions";

export default function Page() {
  return <AuthForm mode="sign-up" onSubmit={signUp} />;
}
