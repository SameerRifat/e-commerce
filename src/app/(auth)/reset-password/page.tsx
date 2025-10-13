// src/app/(auth)/reset-password/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { resetPassword } from "@/lib/auth/actions";
import { XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const tokenParam = searchParams.get("token");
        const errorParam = searchParams.get("error");

        if (errorParam) {
            setError(
                errorParam === "INVALID_TOKEN"
                    ? "This reset link is invalid or has expired."
                    : "An error occurred. Please try again."
            );
        } else if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError("No reset token provided.");
        }
    }, [searchParams]);

    const handleResetPassword = async (newPassword: string, token: string) => {
        try {
            const result = await resetPassword(newPassword, token);
            return result;
        } catch (error) {
            throw error;
        }
    };

    if (error) {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-red-100 p-6">
                        <XCircle className="h-12 w-12 text-red-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-heading-3 text-dark-900">Invalid Reset Link</h1>
                    <p className="text-body text-dark-700">{error}</p>
                </div>

                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link href="/forgot-password">Request New Reset Link</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/sign-in">Back to Sign In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-dark-700" />
            </div>
        );
    }

    return <ResetPasswordForm token={token} onSubmit={handleResetPassword} />;
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-dark-700" />
                </div>
            }
        >
            <ResetPasswordContent />
        </Suspense>
    );
}