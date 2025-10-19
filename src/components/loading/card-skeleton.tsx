// src/components/loading/card-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
    className?: string;
    count?: number;
}

export function CardSkeleton({ className, count = 1 }: CardSkeletonProps) {
    return (
        <div className={cn("grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
}