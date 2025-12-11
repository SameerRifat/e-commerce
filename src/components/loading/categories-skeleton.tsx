// src/components/loading/categories-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

/**
 * CategoriesSkeleton - Matches exact layout of CategoriesSection
 * 
 * Design Requirements:
 * - Section header with title (no subtitle in actual component)
 * - Desktop: Carousel with custom width (91% max-width)
 * - Mobile: Horizontal scroll with left padding
 * - Circular category images (aspect-square, rounded-full)
 * - Category name text below each image
 * - Navigation arrows on desktop (at image edges)
 * - Responsive sizes: 28% mobile, 1/4 tablet, 1/6 desktop
 */

export function CategoriesSkeleton() {
  // Show 6 skeleton items (common category count)
  const skeletonItems = Array.from({ length: 6 }, (_, i) => i);

  return (
    <section>
      <div>
        {/* Section Header Skeleton */}
        <div className="custom_container mb-3 sm:mb-5">
          <Skeleton className="h-6 sm:h-7 2xl:h-8 w-32 sm:w-40" />
        </div>

        {/* Categories Carousel Container */}
        <div className="sm:w-[91%] sm:max-w-[95rem] sm:mx-auto relative">
          {/* Desktop Layout - Grid simulating carousel */}
          <div className="hidden sm:block">
            <div className="flex gap-4 lg:gap-6 overflow-hidden px-3 sm:px-0">
              {skeletonItems.map((index) => (
                <CategoryItemSkeleton key={index} />
              ))}
            </div>
          </div>

          {/* Mobile Layout - Horizontal scroll */}
          <div className="block sm:hidden">
            <div className="flex gap-2 overflow-hidden px-3">
              {skeletonItems.slice(0, 4).map((index) => (
                <CategoryItemSkeleton key={index} mobile />
              ))}
            </div>
          </div>

          {/* Navigation Arrows Skeleton - Desktop only */}
          <div className="hidden sm:block">
            {/* Left arrow */}
            <div className="absolute left-0.5 top-1/2 -translate-y-9.5 z-20">
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
            {/* Right arrow */}
            <div className="absolute right-0.5 top-1/2 -translate-y-9.5 z-20">
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Individual category item skeleton matching the carousel item structure
 */
function CategoryItemSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={`flex-shrink-0 flex flex-col items-center ${mobile ? 'w-[28%]' : 'w-1/4 lg:w-1/6'
        }`}
    >
      {/* Circular category image skeleton */}
      <div className="relative aspect-square w-full mx-auto mb-4">
        <Skeleton className="absolute inset-0 rounded-full" />
      </div>

      {/* Category name skeleton */}
      <Skeleton className="h-3 2xl:h-4 w-16 sm:w-20 mx-auto" />
    </div>
  );
}

export default CategoriesSkeleton;