// src/components/loading/hero-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
    return (
        <section className="relative w-full overflow-hidden bg-black max-w-[95rem] mx-auto">
            {/* Desktop skeleton */}
            <div className="hidden md:block w-full aspect-[2400/900] max-h-[calc(100vh-36px)]">
                <Skeleton className="w-full h-full rounded-none bg-slate-800" />
            </div>
            {/* Mobile skeleton */}
            <div className="block md:hidden w-full aspect-[1000/1333] max-h-[calc(100vh-32px)]">
                <Skeleton className="w-full h-full rounded-none bg-slate-800" />
            </div>
        </section>
    );
}