// components/home/VideoCarouselSection.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';

// Type definitions
interface VideoProduct {
    id: string;
    name: string;
    price: string;
    video: string;
    thumbnail: string;
    linkUrl: string; // URL to product or collection detail page
    linkType?: 'product' | 'collection'; // Optional: for analytics or styling
}

interface VideoCardProps {
    product: VideoProduct;
}

interface VideoCarouselSectionProps {
    videoProducts: VideoProduct[];
}

const VideoCarouselSection = ({ videoProducts }: VideoCarouselSectionProps) => {
    const [api, setApi] = useState<CarouselApi>();
    const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false);
    const [canScrollNext, setCanScrollNext] = useState<boolean>(false);

    // Handle carousel API setup
    useEffect(() => {
        if (!api) return;

        const updateState = () => {
            setCanScrollPrev(api.canScrollPrev());
            setCanScrollNext(api.canScrollNext());
        };

        updateState();
        api.on("select", updateState);
        api.on("reInit", updateState);

        return () => {
            api.off("select", updateState);
            api.off("reInit", updateState);
        };
    }, [api]);

    // Navigation functions
    const scrollPrev = () => api?.scrollPrev();
    const scrollNext = () => api?.scrollNext();

    return (
        <section className="video-carousel-section">
            {/* Desktop: use custom_container */}
            <div className="hidden sm:block">
                <div className="custom_container">
                    <div className="relative">
                        <Carousel
                            setApi={setApi}
                            opts={{
                                align: "start",
                                loop: false,
                                containScroll: "trimSnaps",
                                slidesToScroll: 1,
                            }}
                            className="w-full"
                        >
                            <CarouselContent className="-ml-4 lg:-ml-6">
                                {videoProducts.map((product) => (
                                    <CarouselItem key={product.id} className="pl-4 lg:pl-6 basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                        <VideoCard product={product} />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>

                        {/* Glassmorphic Navigation Arrows - Desktop only */}
                        {canScrollPrev && (
                            <button
                                onClick={scrollPrev}
                                disabled={!canScrollPrev}
                                className="flex absolute left-0 top-1/2 -translate-y-1/2 z-20 
                           items-center justify-center w-12 h-12 rounded-full
                           backdrop-blur-md bg-white/25 border border-white/40
                           shadow-lg hover:shadow-xl
                           transition-all duration-300 ease-out
                           hover:bg-white/35 hover:scale-110
                           cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Previous videos"
                            >
                                <ChevronLeft className="h-6 w-6 text-white drop-shadow-sm" />
                            </button>
                        )}

                        {canScrollNext && (
                            <button
                                onClick={scrollNext}
                                disabled={!canScrollNext}
                                className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 
                           items-center justify-center w-12 h-12 rounded-full
                           backdrop-blur-md bg-white/25 border border-white/80
                           shadow-lg hover:shadow-xl
                           transition-all duration-300 ease-out
                           hover:bg-white/35 hover:scale-110
                           cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Next videos"
                            >
                                <ChevronRight className="h-6 w-6 text-white drop-shadow-sm" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile: full-width scrolling with left padding on first item */}
            <div className="block sm:hidden">
                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "start",
                        loop: false,
                        containScroll: "trimSnaps",
                        slidesToScroll: 1,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-3 px-3">
                        {videoProducts.map((product) => (
                            <CarouselItem
                                key={product.id}
                                className="pl-3 basis-[65%]"
                            >
                                <VideoCard product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
            <div>
                {/* Glassmorphic Navigation Arrows - Always visible on large screens */}
                {canScrollPrev && (
                    <button
                        onClick={scrollPrev}
                        disabled={!canScrollPrev}
                        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 
                       items-center justify-center w-12 h-12 rounded-full
                       backdrop-blur-md bg-white/25 border border-white/40
                       shadow-lg hover:shadow-xl
                       transition-all duration-300 ease-out
                       hover:bg-white/35 hover:scale-110
                       cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Previous videos"
                    >
                        <ChevronLeft className="h-6 w-6 text-white drop-shadow-sm" />
                    </button>
                )}

                {canScrollNext && (
                    <button
                        onClick={scrollNext}
                        disabled={!canScrollNext}
                        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 
                       items-center justify-center w-12 h-12 rounded-full
                       backdrop-blur-md bg-white/25 border border-white/80
                       shadow-lg hover:shadow-xl
                       transition-all duration-300 ease-out
                       hover:bg-white/35 hover:scale-110
                       cursor-pointer
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        aria-label="Next videos"
                    >
                        <ChevronRight className="h-6 w-6 text-white drop-shadow-sm" />
                    </button>
                )}
            </div>
        </section>
    );
};

const VideoCard: React.FC<VideoCardProps> = ({ product }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Ensure video plays automatically and loops
            video.play().catch((error) => {
                console.error('Video autoplay failed:', error);
            });
        }
    }, []);

    return (
        <Link
            href={product.linkUrl}
            className="block w-full h-full"
        >
            <div className="video-carousel-item video-card-overlay relative aspect-[9/16] rounded-3xl overflow-hidden group cursor-pointer">
                {/* Video Background */}
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    poster="/logo.jpg"
                >
                    <source src={product.video} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Overlay Gradient - Bottom Only */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-3xl" />

                {/* Content Overlay - Bottom Positioned with proper containment */}
                <div className="absolute bottom-0 left-0 right-0 p-4 pt-0 text-white">
                    <div className="flex items-end justify-between gap-3 md:gap-4">
                        {/* Product Thumbnail - Bottom Left */}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/95 rounded-lg p-0.5 md:p-1 backdrop-blur-sm shadow-lg">
                                <Image
                                    src={product.thumbnail}
                                    alt={product.name}
                                    width={80}
                                    height={80}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Product Info - Bottom Right */}
                        <div className="flex-1 text-right min-w-0">
                            <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-medium mb-1 md:mb-2 lg:mb-3 font-playfair tracking-wider drop-shadow-lg leading-tight">
                                {product.name}
                            </h3>
                            <p className="text-base md:text-lg lg:text-xl xl:text-2xl font-medium drop-shadow-lg">
                                {product.price}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out rounded-3xl" />

                {/* Interactive Border */}
                <div className="absolute inset-0 rounded-3xl border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-300" />
            </div>
        </Link>
    );
};

export default VideoCarouselSection;
export type { VideoProduct, VideoCardProps };