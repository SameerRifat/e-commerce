// src/components/error/navbar-error.tsx
'use client';

import Link from "next/link";
import Image from "next/image";
import { AlertCircle, RefreshCcw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export function NavbarError({ error, reset }: NavbarErrorProps) {
    return (
        <header className="sticky top-0 z-50 bg-background border-b border-destructive/20">
            <nav className="custom_container flex h-16 items-center justify-between gap-4">
                {/* Logo - Still functional */}
                <Link href="/" aria-label="Home" className="flex items-center">
                    <Image
                        src="/logo.svg"
                        alt="Logo"
                        width={28}
                        height={28}
                        priority
                        className="invert"
                    />
                </Link>

                {/* Error Message - Centered */}
                <div className="flex items-center gap-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Failed to load navigation</span>
                    <Button
                        onClick={reset}
                        variant="outline"
                        size="sm"
                        className="gap-2 h-8"
                    >
                        <RefreshCcw className="h-3 w-3" />
                        <span className="hidden sm:inline">Retry</span>
                    </Button>
                </div>

                {/* Cart - Still functional */}
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/cart" aria-label="Cart">
                        <ShoppingBag className="h-5 w-5" />
                    </Link>
                </Button>
            </nav>
        </header>
    );
}