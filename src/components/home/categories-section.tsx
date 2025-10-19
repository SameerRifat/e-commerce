// src/components/home/categories-section.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useState } from 'react';
import type { CarouselApi } from '@/components/ui/carousel';
import type { HomepageCategory } from '@/lib/actions/homepage-categories';
import SectionHeader from '../shared/section-header';

interface CategoriesSectionProps {
  categories: HomepageCategory[];
}

const CategoriesSection = ({ categories }: CategoriesSectionProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState<boolean>(false);
  const [canScrollNext, setCanScrollNext] = useState<boolean>(false);

  // Handle carousel API setup
  const handleApiChange = (newApi: CarouselApi): void => {
    if (!newApi) return;

    setApi(newApi);

    const updateState = (): void => {
      setCanScrollPrev(newApi.canScrollPrev());
      setCanScrollNext(newApi.canScrollNext());
    };

    updateState();
    newApi.on("select", updateState);
    newApi.on("reInit", updateState);
  };

  // Navigation functions
  const scrollPrev = (): void => {
    api?.scrollPrev();
  };

  const scrollNext = (): void => {
    api?.scrollNext();
  };

  // Early return if no categories
  if (!categories || categories.length === 0) {
    return null; // Or return a placeholder/skeleton
  }

  return (
    <section>
      <div>
        <div className='custom_container'>
          <SectionHeader
            title="Categories"
          // subtitle="Discover our curated collection of premium fragrances"
          />
        </div>

        <div
          className="sm:w-[91%] sm:max-w-[95rem] sm:mx-auto relative"
        >
          <Carousel
            setApi={handleApiChange}
            opts={{
              align: "start",
              loop: false,
              containScroll: "trimSnaps",
              slidesToScroll: 3,
              skipSnaps: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4 lg:-ml-6 px-3 sm:px-0">
              {categories.map((category) => (
                <CarouselItem
                  key={category.id}
                  className="pl-2 md:pl-4 lg:pl-6 basis-[28%] sm:basis-1/4 lg:basis-1/6"
                >
                  <div className="flex flex-col items-center justify-center group">
                    <Link href={category.linkUrl} className="w-full">
                      <div className="relative aspect-square w-full mx-auto mb-4 overflow-hidden rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                        <Image
                          src={category.imageUrl}
                          alt={category.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={false} // Lazy load for performance
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <h3 className="text-foreground font-medium text-xs 2xl:text-sm text-center group-hover:text-primary transition-colors duration-300">
                        {category.name}
                      </h3>
                    </Link>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Glassmorphic Navigation Arrows - Positioned at image edges */}
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className="hidden sm:flex absolute left-0.5 top-1/2 -translate-y-9.5 z-20 
                     items-center justify-center w-12 h-12 rounded-full
                     backdrop-blur-md bg-white/25 border border-white/40
                     shadow-lg hover:shadow-xl
                     transition-all duration-300 ease-out
                     hover:bg-white/35 hover:scale-110
                     cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Previous categories"
            >
              <ChevronLeft className="h-6 w-6 text-white drop-shadow-sm" />
            </button>
          )}

          {canScrollNext && (
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className="hidden sm:flex absolute right-0.5 top-1/2 -translate-y-9.5 z-20 
                     items-center justify-center w-12 h-12 rounded-full
                     backdrop-blur-md bg-white/25 border border-white/80
                     shadow-lg hover:shadow-xl
                     transition-all duration-300 ease-out
                     hover:bg-white/35 hover:scale-110
                     cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Next categories"
            >
              <ChevronRight className="h-6 w-6 text-white drop-shadow-sm" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;