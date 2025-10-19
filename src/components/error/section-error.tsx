// src/components/error/section-error.tsx
'use client';

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SectionErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
    title?: string;
    className?: string;
}

export function SectionError({
    error,
    reset,
    title = "Something went wrong",
    className = ""
}: SectionErrorProps) {
    return (
        <div className={`flex min-h-[300px] w-full items-center justify-center p-4 ${className}`}>
            <Alert variant="destructive" className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription className="mt-2">
                    <p className="text-sm mb-4">
                        {error.message || "An unexpected error occurred while loading this section."}
                    </p>
                    <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                    >
                        <RefreshCcw className="h-3 w-3" />
                        Try Again
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    );
}
