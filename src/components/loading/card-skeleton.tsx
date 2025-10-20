// src/components/loading/card-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import ProductGrid from "@/components/shared/product-grid";

interface CardSkeletonProps {
    count?: number;
}

export function CardSkeleton({ count = 1 }: CardSkeletonProps) {
    return (
        <ProductGrid>
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
        </ProductGrid>
    );
}