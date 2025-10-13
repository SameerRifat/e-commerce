// src/components/auth/forgot-password-form.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

type Props = {
  onSubmit: (email: string) => Promise<{ ok: boolean; message?: string }>;
};

export default function ForgotPasswordForm({ onSubmit }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);

    try {
      const result = await onSubmit(values.email);

      if (result.ok) {
        setEmailSent(true);
        setSentEmail(values.email);
        toast.success("Password reset link sent! Check your email.");
      } else {
        toast.error(result.message || "Failed to send reset link");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Mail className="h-12 w-12 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-heading-3 text-dark-900">Check Your Email</h1>
          <p className="text-body text-dark-700">
            We&apos;ve sent a password reset link to
          </p>
          <p className="font-medium text-dark-900">{sentEmail}</p>
        </div>

        <div className="space-y-4 rounded-lg border border-light-300 bg-light-100 p-4 text-caption text-dark-700">
          <p>Click the link in the email to reset your password.</p>
          <p>
            <strong>Didn&apos;t receive the email?</strong> Check your spam folder
            or try again with a different email address.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setEmailSent(false);
              form.reset();
            }}
          >
            Try Another Email
          </Button>

          <Button variant="ghost" className="w-full" asChild>
            <Link href="/sign-in">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </Button>
        </div>

        <p className="text-center text-footnote text-dark-700">
          The reset link will expire in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link
          href="/sign-in"
          className="inline-flex items-center text-caption text-dark-700 hover:text-dark-900 transition-colors mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In
        </Link>
        <h1 className="mt-3 text-heading-3 text-dark-900">Forgot Password?</h1>
        <p className="mt-1 text-body text-dark-700">
          No worries! Enter your email and we&apos;ll send you reset instructions.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-caption text-dark-900">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="johndoe@gmail.com"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-2 w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-caption text-dark-700">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="underline hover:text-dark-900 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}