// src/components/loading/navbar-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function NavbarSkeleton() {
    return (
        <header className="sticky top-0 z-50 bg-background border-b border-border">
            <nav className="custom_container flex h-16 items-center gap-4 lg:gap-6">
                {/* Logo Skeleton */}
                <Skeleton className="h-7 w-7 flex-shrink-0" />

                {/* Desktop Navigation Links Skeleton */}
                <div className="hidden items-center gap-6 lg:gap-8 md:flex flex-shrink-0 ml-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>

                {/* Desktop Search Skeleton */}
                <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
                    <Skeleton className="h-9 w-full max-w-xl rounded-md" />
                </div>

                {/* Desktop Actions Skeleton */}
                <div className="hidden items-center gap-3 md:flex flex-shrink-0">
                    <Skeleton className="h-9 w-20" /> {/* Cart button */}
                    <Skeleton className="h-9 w-24" /> {/* Sign in button / User menu */}
                </div>

                {/* Mobile Actions Skeleton */}
                <div className="flex items-center gap-2 md:hidden ml-auto">
                    <Skeleton className="h-9 w-9" /> {/* Search icon */}
                    <Skeleton className="h-9 w-9" /> {/* Cart icon */}
                    <Skeleton className="h-9 w-9" /> {/* Menu icon */}
                </div>
            </nav>
        </header>
    );
}