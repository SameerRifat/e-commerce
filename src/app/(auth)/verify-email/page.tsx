// src/app/(auth)/verify-email/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function VerifyContent({ searchParams }: { searchParams: { token?: string; error?: string } }) {
    const { token, error } = searchParams;

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="flex justify-center">
                        <XCircle className="h-16 w-16 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Verification Failed</h1>
                    <p className="text-muted-foreground">
                        {error === "invalid"
                            ? "This verification link is invalid or has expired."
                            : "An error occurred during verification."}
                    </p>
                    <Button asChild>
                        <Link href="/sign-in">Return to Sign In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Success case
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold">Email Verified!</h1>
                <p className="text-muted-foreground">
                    Your email has been successfully verified. You can now sign in to your account.
                </p>
                <Button asChild>
                    <Link href="/">Go to Homepage</Link>
                </Button>
            </div>
        </div>
    );
}

export default function VerifyEmailPage({
    searchParams,
}: {
    searchParams: { token?: string; error?: string };
}) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyContent searchParams={searchParams} />
        </Suspense>
    );
}