// src/components/products/load-more-button.tsx
"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LoadMoreButtonProps {
    onClick: () => void;
    isPending: boolean;
    disabled?: boolean;
}

export function LoadMoreButton({
    onClick,
    isPending,
    disabled = false,
}: LoadMoreButtonProps) {
    return (
        <div className="flex justify-center py-8">
            <Button
                onClick={onClick}
                disabled={isPending || disabled}
                variant="outline"
                size="lg"
                className="min-w-48"
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                    </>
                ) : (
                    "Load More Products"
                )}
            </Button>
        </div>
    );
}