// src/components/ProductGallery.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ImageOff } from "lucide-react";
import { useVariantStore } from "@/store/variant";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

type Variant = {
  color: string;
  images: string[];
};

export interface ProductGalleryProps {
  productId: string;
  variants: Variant[];
  initialVariantIndex?: number;
  className?: string;
}

function isValidSrc(src: string | undefined | null) {
  return typeof src === "string" && src.trim().length > 0;
}

export default function ProductGallery({
  productId,
  variants,
  initialVariantIndex = 0,
  className = "",
}: ProductGalleryProps) {
  const validVariants = useMemo(
    () => variants.filter((v) => Array.isArray(v.images) && v.images.some(isValidSrc)),
    [variants]
  );

  const variantIndex =
    useVariantStore(
      (s) => s.selectedByProduct[productId] ?? Math.min(initialVariantIndex, Math.max(validVariants.length - 1, 0))
    );

  const images = validVariants[variantIndex]?.images?.filter(isValidSrc) ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    const listener = () => checkMobile();
    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [variantIndex]);

  const onThumbClick = useCallback(
    (index: number) => {
      mainApi?.scrollTo(index);
    },
    [mainApi]
  );

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return;
    const selected = mainApi.selectedScrollSnap();
    setActiveIndex(selected);
    thumbApi.scrollTo(selected);
  }, [mainApi, thumbApi]);

  useEffect(() => {
    if (!mainApi) return;
    onSelect();
    mainApi.on("select", onSelect);
    return () => {
      mainApi.off("select", onSelect);
    };
  }, [mainApi, onSelect]);

  if (images.length === 0) {
    return (
      <section className={`flex w-full flex-col gap-4 ${className}`}>
        <div className="relative w-full aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageOff className="h-8 w-8" />
            <span className="text-sm">No images available</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`flex w-full flex-col lg:flex-row gap-3 lg:gap-4 ${className}`}>
      {/* Desktop Thumbnail Carousel - Vertical */}
      {images.length > 1 && !isMobile && (
        <div className="w-24 order-2 lg:order-1 hidden lg:flex flex-col">
          <Carousel
            setApi={setThumbApi}
            opts={{
              align: "start",
              containScroll: "keepSnaps",
              dragFree: true,
              axis: "y",
            }}
            orientation="vertical"
            className="w-full"
          >
            <CarouselContent className="-mt-1 p-0.5">
              {images.map((src, index) => (
                <CarouselItem
                  key={`thumb-${src}-${index}`}
                  className="basis-1/3 py-1"
                >
                  <button
                    onClick={() => onThumbClick(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`relative aspect-square w-full bg-muted rounded-md overflow-hidden ring-2 transition-all duration-200 group hover:opacity-80 ${activeIndex === index ? "ring-primary" : "ring-transparent hover:ring-muted-foreground/30"
                      }`}
                  >
                    <Image
                      src={src}
                      alt={`Product thumbnail ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="100px"
                    />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* Mobile Thumbnail Carousel - Horizontal */}
      {images.length > 1 && isMobile && (
        <div className="w-full order-2 lg:order-1 lg:hidden mt-2">
          <Carousel
            setApi={setThumbApi}
            opts={{
              align: "start",
              containScroll: "keepSnaps",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 p-0.5">
              {images.map((src, index) => (
                <CarouselItem
                  key={`thumb-${src}-${index}`}
                  className="basis-1/5 pl-2"
                >
                  <button
                    onClick={() => onThumbClick(index)}
                    aria-label={`View image ${index + 1}`}
                    className={`relative aspect-square w-full bg-muted rounded-md overflow-hidden ring-2 transition-all duration-200 group hover:opacity-80 ${activeIndex === index ? "ring-primary" : "ring-transparent hover:ring-muted-foreground/30"
                      }`}
                  >
                    <Image
                      src={src}
                      alt={`Product thumbnail ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 18vw, 100px"
                    />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* Main Carousel */}
      <div className="flex-1 flex flex-col gap-2 lg:gap-4 order-1 lg:order-2">
        <div className="w-full">
          <Carousel
            setApi={setMainApi}
            opts={{
              align: "center",
              loop: images.length > 1,
            }}
            className="w-full"
          >
            <CarouselContent>
              {images.map((src, index) => (
                <CarouselItem key={`${src}-${index}`}>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={src}
                      alt={`Product image ${index + 1}`}
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                      priority={index === 0}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-2 h-10 w-10 bg-white/80 hover:bg-white" />
                <CarouselNext className="right-2 h-10 w-10 bg-white/80 hover:bg-white" />
              </>
            )}
          </Carousel>
        </div>

        {/* Image Counter */}
        {/* {images.length > 1 && (
          <div className="text-center text-xs text-muted-foreground">
            {activeIndex + 1} / {images.length}
          </div>
        )} */}
      </div>
    </section>
  );
}