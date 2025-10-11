// src/components/auth/sign-out-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SignOutButtonProps {
    children?: React.ReactNode;
    className?: string;
    redirectTo?: string;
    onSuccess?: () => void;
}

export default function SignOutButton({
    children,
    className,
    redirectTo = "/",
    onSuccess,
}: SignOutButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Signed out successfully");
                        if (onSuccess) {
                            onSuccess();
                        }
                        router.push(redirectTo);
                        router.refresh();
                    },
                    onError: (ctx) => {
                        console.error("Sign out error:", ctx.error);
                        toast.error("Failed to sign out. Please try again.");
                        setIsLoading(false);
                    },
                },
            });
        } catch (error) {
            console.error("Sign out error:", error);
            toast.error("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSignOut}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing out...
                </>
            ) : (
                children || "Sign Out"
            )}
        </button>
    );
}