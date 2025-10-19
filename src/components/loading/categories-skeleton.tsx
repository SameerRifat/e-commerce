// src/components/loading/categories-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesSkeleton() {
  return (
    <section>
      <div className="custom_container">
        <div className="mb-8 sm:mb-12">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-5 w-96 hidden sm:block" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-shrink-0">
              <Skeleton className="aspect-square w-20 sm:w-28 lg:w-32 rounded-full mb-4" />
              <Skeleton className="h-4 w-16 sm:w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}