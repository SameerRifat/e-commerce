// src/app/(auth)/verification-pending/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { resendVerificationEmail } from "@/lib/auth/actions";

export default function VerificationPendingPage() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) return;

        setIsResending(true);
        try {
            const result = await resendVerificationEmail(email);
            if (result.ok) {
                toast.success("Verification email sent! Check your inbox.");
            } else {
                toast.error(result.message || "Failed to send email");
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-primary/10 p-6">
                        <Mail className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">Check Your Email</h1>
                    <p className="text-muted-foreground">
                        We&apos;ve sent a verification link to
                    </p>
                    {email && (
                        <p className="font-medium text-foreground">{email}</p>
                    )}
                </div>

                <div className="space-y-4 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                    <p>Click the link in the email to verify your account.</p>
                    <p>
                        <strong>Didn&apos;t receive the email?</strong> Check your spam folder
                        or request a new verification email.
                    </p>
                </div>

                <Button
                    onClick={handleResend}
                    disabled={isResending || !email}
                    variant="outline"
                    className="w-full"
                >
                    {isResending ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Verification Email
                        </>
                    )}
                </Button>

                <p className="text-xs text-muted-foreground">
                    The verification link will expire in 1 hour.
                </p>
            </div>
        </div>
    );
}