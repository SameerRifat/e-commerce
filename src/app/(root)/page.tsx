// src/app/(root)/page.tsx
import React from "react";
import { getCurrentUser } from "@/lib/auth/actions";
import { getAllProducts } from "@/lib/actions/product";
import { getActiveHeroSlides } from "@/lib/actions/hero-slides";
import { getHomepageCategories } from "@/lib/actions/homepage-categories";
import HeroSection from "@/components/home/hero-section";
import LatestProductsSection from "@/components/home/latest-products";
import CategoriesSection from "@/components/home/categories-section";
import { HeroSlide } from "@/components/home/hero-carousel";
import { getHeroSlideLink } from "@/lib/utils/hero-slides";
import FeaturesSection from "@/components/home/features-section";

const Home = async () => {
  const user = await getCurrentUser();
  
  // Parallel data fetching for optimal performance
  const [
    { products },
    heroSlidesData,
    categories
  ] = await Promise.all([
    getAllProducts({ limit: 4 }),
    getActiveHeroSlides(),
    getHomepageCategories()
  ]);

  // Transform hero slides to carousel format
  const desktopHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
    type: slide.desktopMediaType as 'image' | 'video',
    src: slide.desktopMediaUrl,
    linkUrl: getHeroSlideLink(slide),
    altText: slide.altText || undefined,
  }));

  const mobileHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
    type: slide.mobileMediaType as 'image' | 'video',
    src: slide.mobileMediaUrl,
    linkUrl: getHeroSlideLink(slide),
    altText: slide.altText || undefined,
  }));

  // Fallback to static slides if no database slides exist
  const hasSlides = desktopHeroSlides.length > 0;

  const finalDesktopSlides = hasSlides ? desktopHeroSlides : [
    {
      type: 'image' as const,
      src: '/hero-banners/1.webp',
    },
  ];

  const finalMobileSlides = hasSlides ? mobileHeroSlides : [
    {
      type: 'image' as const,
      src: '/hero-banners/mobile-1.webp',
    },
  ];

  return (
    <>
      <HeroSection
        desktopSlides={finalDesktopSlides}
        mobileSlides={finalMobileSlides}
      />
      <CategoriesSection categories={categories} />
      <LatestProductsSection products={products} />
      <FeaturesSection />
    </>
  );
};

export default Home;