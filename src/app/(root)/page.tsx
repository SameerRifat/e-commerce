// src/app/(root)/page.tsx
import React from "react";
import { getCurrentUser } from "@/lib/auth/actions";
import { getAllProducts } from "@/lib/actions/product";
import HeroSection from "@/components/home/hero-section";
import LatestProductsSection from "@/components/home/latest-products";
import { HeroSlide } from "@/components/home/hero-carousel";

const Home = async () => {
  const user = await getCurrentUser();
  const { products } = await getAllProducts({ limit: 4 });

  // Desktop hero slides
  const desktopHeroSlides: HeroSlide[] = [
    {
      type: 'image',
      src: '/hero-banners/1.webp',
    },
    {
      type: 'video',
      src: '/hero-banners/2.mp4',
    },
    {
      type: 'image',
      src: '/hero-banners/3.webp',
    },
    {
      type: 'image',
      src: '/hero-banners/4.webp',
    },
    {
      type: 'image',
      src: '/hero-banners/5.webp',
    },
    {
      type: 'video',
      src: '/hero-banners/6.mp4',
    },
  ];

  // Mobile hero slides (optimized for mobile screens)
  const mobileHeroSlides: HeroSlide[] = [
    {
      type: 'image',
      src: '/hero-banners/mobile-1.webp',
    },
    {
      type: 'video',
      src: '/hero-banners/mobile-2.mp4',
    },
    {
      type: 'image',
      src: '/hero-banners/mobile-3.webp',
    },
    {
      type: 'image',
      src: '/hero-banners/mobile-4.webp',
    },
    {
      type: 'image',
      src: '/hero-banners/mobile-5.webp',
    },
    {
      type: 'video',
      src: '/hero-banners/mobile-6.mp4',
    },
  ];

  return (
    <>
      <HeroSection
        desktopSlides={desktopHeroSlides}
        mobileSlides={mobileHeroSlides}
      />
      <LatestProductsSection products={products} />
    </>
  );
};

export default Home;