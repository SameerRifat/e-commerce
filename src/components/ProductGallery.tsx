// src/components/ProductGallery.tsx
"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { useVariantStore } from "@/store/variant";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  const [mainApi, setMainApi] = useState<any>();
  const [thumbApi, setThumbApi] = useState<any>();
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
    return () => mainApi.off("select", onSelect);
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
        <div className="w-full order-2 lg:order-1 lg:hidden mt-3">
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
        {images.length > 1 && (
          <div className="text-center text-xs text-muted-foreground">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </section>
  );
}

// // src/components/ProductGallery.tsx
// "use client";

// import Image from "next/image";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
// import { useVariantStore } from "@/store/variant";

// type Variant = {
//   color: string;
//   images: string[];
// };

// export interface ProductGalleryProps {
//   productId: string;
//   variants: Variant[];
//   initialVariantIndex?: number;
//   className?: string;
// }

// function isValidSrc(src: string | undefined | null) {
//   return typeof src === "string" && src.trim().length > 0;
// }

// export default function ProductGallery({
//   productId,
//   variants,
//   initialVariantIndex = 0,
//   className = "",
// }: ProductGalleryProps) {
//   const validVariants = useMemo(
//     () => variants.filter((v) => Array.isArray(v.images) && v.images.some(isValidSrc)),
//     [variants]
//   );

//   const variantIndex =
//     useVariantStore(
//       (s) => s.selectedByProduct[productId] ?? Math.min(initialVariantIndex, Math.max(validVariants.length - 1, 0))
//     );

//   const images = validVariants[variantIndex]?.images?.filter(isValidSrc) ?? [];
//   const [activeIndex, setActiveIndex] = useState(0);
//   const mainRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setActiveIndex(0);
//   }, [variantIndex]);

//   const go = useCallback(
//     (dir: -1 | 1) => {
//       if (images.length === 0) return;
//       setActiveIndex((i) => (i + dir + images.length) % images.length);
//     },
//     [images.length]
//   );

//   useEffect(() => {
//     const onKey = (e: KeyboardEvent) => {
//       if (!mainRef.current) return;
//       if (!document.activeElement) return;
//       if (!mainRef.current.contains(document.activeElement)) return;
//       if (e.key === "ArrowLeft") go(-1);
//       if (e.key === "ArrowRight") go(1);
//     };
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [go]);

//   return (
//     <section className={`flex w-full flex-col gap-4 lg:flex-row ${className}`}>
//       <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col">
//         {images.map((src, i) => (
//           <button
//             key={`${src}-${i}`}
//             aria-label={`Thumbnail ${i + 1}`}
//             onClick={() => setActiveIndex(i)}
//             className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-light-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${i === activeIndex ? "ring-[--color-dark-500]" : ""}`}
//           >
//             <Image src={src} alt={`Thumbnail ${i + 1}`} fill sizes="64px" className="object-cover" />
//           </button>
//         ))}
//       </div>

//       <div ref={mainRef} className="order-1 relative w-full h-[500px] overflow-hidden rounded-xl bg-light-200 lg:order-2">
//         {images.length > 0 ? (
//           <>
//             <Image
//               src={images[activeIndex]}
//               alt="Product image"
//               fill
//               sizes="(min-width:1024px) 720px, 100vw"
//               className="object-cover"
//               priority
//             />

//             <div className="absolute inset-0 flex items-center justify-between px-2">
//               <button
//                 aria-label="Previous image"
//                 onClick={() => go(-1)}
//                 className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
//               >
//                 <ChevronLeft className="h-5 w-5 text-dark-900" />
//               </button>
//               <button
//                 aria-label="Next image"
//                 onClick={() => go(1)}
//                 className="rounded-full bg-light-100/80 p-2 ring-1 ring-light-300 transition hover:bg-light-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
//               >
//                 <ChevronRight className="h-5 w-5 text-dark-900" />
//               </button>
//             </div>
//           </>
//         ) : (
//           <div className="flex h-full w-full items-center justify-center text-dark-700">
//             <div className="flex items-center gap-2 rounded-lg border border-light-300 bg-light-100 px-4 py-3">
//               <ImageOff className="h-5 w-5" />
//               <span className="text-body">No images available</span>
//             </div>
//           </div>
//         )}
//       </div>

//     </section>
//   );
// }
