// ============================================
// src/components/home/HeroSection.tsx
// ============================================
import React from "react";
import HeroCarousel from "@/components/home/hero-carousel";
import type { HeroSlide } from "@/components/home/hero-carousel";

interface HeroSectionProps {
  desktopSlides: HeroSlide[];
  mobileSlides: HeroSlide[];
}

const HeroSection: React.FC<HeroSectionProps> = ({ desktopSlides, mobileSlides }) => {
  return (
    <section className="relative w-full overflow-hidden bg-black max-w-[95rem] mx-auto">
      {/* Desktop Hero (hidden on small screens) */}
      <div className="hidden md:block w-full h-full aspect-[2400/900] max-h-[calc(100vh-36px)]">
        <HeroCarousel slides={desktopSlides} />
      </div>

      {/* Mobile Hero (visible only on small screens) */}
      <div className="block md:hidden w-full h-full aspect-[1000/1333] max-h-[calc(100vh-32px)]">
        <HeroCarousel slides={mobileSlides} />
      </div>

      {/* Scroll Indicator - Hide on mobile for cleaner look */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden lg:block pointer-events-none">
        <div className="flex flex-col items-center text-white/70 animate-bounce">
          <span className="text-sm font-medium mb-2">Scroll to Explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full relative">
            <div className="w-1 h-3 bg-white/70 rounded-full absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;