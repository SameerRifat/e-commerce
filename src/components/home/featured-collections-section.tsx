// src/components/home/featured-collections-section.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import type { CarouselApi } from '@/components/ui/carousel';
import Link from 'next/link';

// Type definitions matching your schema
interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}

interface FeaturedCollectionsSectionProps {
  collections: Collection[];
}

// Main Section Component
const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({ collections }) => {
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

  if (!collections || collections.length === 0) {
    return null;
  }

  // Navigation functions
  const scrollPrev = () => api?.scrollPrev();
  const scrollNext = () => api?.scrollNext();

  return (
    <section className="w-full overflow-hidden">
      <div className="custom_container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-lg sm:text-xl 2xl:text-2xl font-medium leading-tight mb-2">
              Shop Collections
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Discover our curated selections for every occasion
            </p>
          </div>

          {/* Desktop View All */}
          <Link
            href="/collections"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            View All
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Desktop Carousel with custom_container */}
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
                <CarouselContent className="-ml-3 sm:-ml-4 lg:-ml-5">
                  {collections.map((collection) => (
                    <CarouselItem
                      key={collection.id}
                      className="pl-3 sm:pl-4 lg:pl-5 basis-1/2 md:basis-1/3 lg:basis-1/4"
                    >
                      <CollectionCard collection={collection} />
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
                             items-center justify-center w-10 h-10 rounded-full
                             backdrop-blur-md bg-white/90 border border-gray-200
                             shadow-lg hover:shadow-xl
                             transition-all duration-300 ease-out
                             hover:bg-white hover:scale-110
                             cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Previous collections"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
              )}

              {canScrollNext && (
                <button
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  className="flex absolute right-0 top-1/2 -translate-y-1/2 z-20 
                             items-center justify-center w-10 h-10 rounded-full
                             backdrop-blur-md bg-white/90 border border-gray-200
                             shadow-lg hover:shadow-xl
                             transition-all duration-300 ease-out
                             hover:bg-white hover:scale-110
                             cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Next collections"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Carousel - full-width scrolling */}
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
              {collections.map((collection) => (
                <CarouselItem
                  key={collection.id}
                  className="pl-3 basis-[40%]"
                >
                  <CollectionCard collection={collection} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>

      {/* Mobile View All Button */}
      <div className="flex md:hidden justify-center mt-6 custom_container">
        <Link
          href="/collections"
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium 
                     text-primary border border-primary/20 rounded-full
                     hover:bg-primary/5 transition-colors"
        >
          View All Collections
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

// Collection Card Component
const CollectionCard: React.FC<{ collection: Collection }> = ({ collection }) => {
  const imageUrl = collection.thumbnailUrl || collection.imageUrl;
  const hasImage = !!imageUrl;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group block relative overflow-hidden rounded-lg sm:rounded-2xl border border-gray-200 
                 hover:border-gray-300 bg-white shadow-sm hover:shadow-xl 
                 transition-all duration-300"
    >
      {/* Image Container - 3:4 aspect ratio for modern look */}
      <div className="relative aspect-[4/3.5] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {hasImage ? (
          <img
            src={imageUrl}
            alt={collection.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              className="w-16 h-16 sm:w-20 sm:h-20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Light gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent 
                        opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Collection Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
          <h3 className="text-sm sm:text-base md:text-lg font-medium sm:font-semibold sm:mb-1 line-clamp-1 
                         transition-transform duration-300 group-hover:translate-y-[-2px]">
            {collection.name}
          </h3>
          {collection.description && (
            <p className="hidden sm:flex text-xs sm:text-sm opacity-90 line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>

        {/* Hover shine effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 
                        bg-gradient-to-r from-transparent via-white/10 to-transparent
                        transform -translate-x-full group-hover:translate-x-full
                        transition-all duration-1000" />
      </div>
    </Link>
  );
};

export default FeaturedCollectionsSection