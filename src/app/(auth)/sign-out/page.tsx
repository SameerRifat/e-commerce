// src/app/(auth)/sign-out/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

export default function SignOutPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleSignOut = async () => {
            try {
                await authClient.signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            router.push("/");
                        },
                        onError: (ctx) => {
                            console.error("Sign out error:", ctx.error);
                            setError("Failed to sign out. Please try again.");
                        },
                    },
                });
            } catch (err) {
                console.error("Sign out error:", err);
                setError("An unexpected error occurred.");
            }
        };

        handleSignOut();
    }, [router]);

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/")}
                        className="text-primary underline"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Signing you out...</p>
            </div>
        </div>
    );
}