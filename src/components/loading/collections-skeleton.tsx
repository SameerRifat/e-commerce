// src/components/loading/collections-skeleton.tsx
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * FeaturedCollectionsSkeleton - Matches the updated carousel layout
 * Uses Shadcn Skeleton component for consistency
 */
const FeaturedCollectionsSkeleton: React.FC = () => {
  // Show 5 skeleton cards to match the desktop layout
  const skeletonCards = Array.from({ length: 4 }, (_, i) => i);

  return (
    <section className="w-full overflow-hidden">
      <div className="custom_container">
        {/* Header Skeleton */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div className="space-y-2">
            {/* Title skeleton */}
            <Skeleton className="h-6 sm:h-7 w-48 sm:w-64" />
            {/* Subtitle skeleton */}
            <Skeleton className="h-4 sm:h-5 w-64 sm:w-96" />
          </div>
          {/* View All link skeleton - Desktop only */}
          <Skeleton className="hidden md:block h-5 w-24" />
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Desktop Skeleton */}
        <div className="hidden sm:block">
          <div className="custom_container">
            <div className="flex gap-3 sm:gap-4 lg:gap-5">
              {skeletonCards.map((index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ minWidth: 0 }}
                >
                  <CollectionCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Skeleton */}
        <div className="block sm:hidden px-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-[40%]">
              <CollectionCardSkeleton />
            </div>
            <div className="flex-shrink-0 w-[40%]">
              <CollectionCardSkeleton />
            </div>
            <div className="flex-shrink-0 w-[40%]">
              <CollectionCardSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View All Button Skeleton */}
      <div className="flex md:hidden justify-center mt-6 custom_container">
        <Skeleton className="h-8 w-44 rounded-full" />
      </div>
    </section>
  );
};

/**
 * Individual collection card skeleton
 */
const CollectionCardSkeleton: React.FC = () => {
  return (
    <div className="block relative overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Image Container - 3:4 aspect ratio */}
      <div className="relative aspect-[4/3.5] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Image skeleton */}
        <Skeleton className="absolute inset-0 w-full h-full" />

        {/* Gradient Overlay (matching actual component) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-black/5 to-transparent opacity-60" />

        {/* Collection Info Skeleton - Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Collection name skeleton (white for contrast) */}
          <Skeleton className="h-5 sm:h-6 w-3/4 bg-white/30" />
          {/* Description skeleton (2 lines) */}
          <Skeleton className="hidden sm:flex h-3 sm:h-4 w-full bg-white/25" />
          <Skeleton className="hidden sm:flex h-3 sm:h-4 w-5/6 bg-white/25" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedCollectionsSkeleton;