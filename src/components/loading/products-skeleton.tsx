// src/components/loading/products-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "./card-skeleton";

export function ProductsSkeleton() {
    return (
        <section className="custom_container py-12">
            <Skeleton className="h-8 w-48 mb-6" />
            <CardSkeleton count={4} />
        </section>
    );
}