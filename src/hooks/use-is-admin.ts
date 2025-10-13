"use client";

import { useSession } from "@/lib/auth/client";

export function useIsAdmin() {
    const { data: session } = useSession();

    return {
        isAdmin: session?.user?.role === "admin",
        isLoading: !session,
        user: session?.user,
    };
}