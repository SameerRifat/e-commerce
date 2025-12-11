// src/components/loading/video-carousel-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

/**
 * VideoCarouselSkeleton - Matches exact layout of VideoCarouselSection
 * 
 * Design Requirements:
 * - Desktop: 4 columns (XL), 3 columns (LG), 2 columns (MD)
 * - Mobile: Horizontal scroll, 65% basis
 * - 9:16 aspect ratio cards (portrait)
 * - Rounded corners (rounded-3xl)
 * - Bottom overlay with thumbnail + text areas
 * - Navigation arrows on desktop
 * - Proper spacing matching custom_container
 */

export function VideoCarouselSkeleton() {
    // Generate 4 skeleton cards (common default count)
    const skeletonCards = Array.from({ length: 4 }, (_, i) => i);

    return (
        <section className="video-carousel-skeleton">
            {/* Desktop Layout - Matches custom_container */}
            <div className="hidden sm:block">
                <div className="custom_container">
                    <div className="relative">
                        {/* Grid matching CarouselContent spacing */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                            {skeletonCards.map((index) => (
                                <SkeletonVideoCard key={index} />
                            ))}
                        </div>

                        {/* Skeleton Navigation Arrows - Desktop */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-20">
                            <Skeleton className="w-12 h-12 rounded-full" />
                        </div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
                            <Skeleton className="w-12 h-12 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout - Horizontal Scroll */}
            <div className="block sm:hidden">
                <div className="flex gap-3 overflow-hidden px-3">
                    {skeletonCards.slice(0, 3).map((index) => (
                        <div key={index} className="flex-shrink-0 w-[65%]">
                            <SkeletonVideoCard />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/**
 * Individual skeleton video card matching VideoCard component
 */
function SkeletonVideoCard() {
    return (
        <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-gray-200">
            {/* Video Background Skeleton */}
            <Skeleton className="absolute inset-0 w-full h-full" />

            {/* Bottom Gradient Area (matching overlay position) */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/40 via-black/20 to-transparent rounded-b-3xl" />

            {/* Content Overlay - Bottom Positioned */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-0">
                <div className="flex items-end justify-between gap-3 md:gap-4">
                    {/* Product Thumbnail Skeleton - Bottom Left */}
                    <div className="flex-shrink-0">
                        <Skeleton className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg bg-white/30" />
                    </div>

                    {/* Product Info Skeleton - Bottom Right */}
                    <div className="flex-1 text-right space-y-2 lg:space-y-3">
                        {/* Product Name Skeleton */}
                        <Skeleton className="h-5 md:h-6 lg:h-7 xl:h-8 w-full bg-white/30 ml-auto" />
                        <Skeleton className="h-4 md:h-5 lg:h-6 w-3/4 bg-white/30 ml-auto" />

                        {/* Price Skeleton */}
                        <Skeleton className="h-4 md:h-5 lg:h-6 xl:h-7 w-1/2 bg-white/30 ml-auto" />
                    </div>
                </div>
            </div>

            {/* Border decoration (matching hover effect structure) */}
            <div className="absolute inset-0 rounded-3xl border-2 border-white/10" />
        </div>
    );
}

export default VideoCarouselSkeleton;