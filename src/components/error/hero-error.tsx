'use client';

import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export function HeroError({ error, reset }: HeroErrorProps) {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 max-w-[95rem] mx-auto">
            <div className="hidden md:block w-full aspect-[2400/900] max-h-[calc(100vh-36px)]">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white p-8">
                        <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
                        <h2 className="text-2xl font-bold mb-2">Failed to load hero banner</h2>
                        <p className="text-slate-300 mb-6 max-w-md">
                            {error.message || "We couldn't load the banner. Please try again."}
                        </p>
                        <Button onClick={reset} variant="secondary" className="gap-2">
                            <RefreshCcw className="h-4 w-4" />
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
            <div className="block md:hidden w-full aspect-[1000/1333] max-h-[calc(100vh-32px)]">
                <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white p-6">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                        <h2 className="text-xl font-bold mb-2">Failed to load banner</h2>
                        <p className="text-slate-300 text-sm mb-4">
                            Please try again.
                        </p>
                        <Button onClick={reset} size="sm" variant="secondary" className="gap-2">
                            <RefreshCcw className="h-3 w-3" />
                            Retry
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}