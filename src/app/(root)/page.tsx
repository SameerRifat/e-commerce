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

  // console.log('categories: ', JSON.stringify(categories, null, 2))

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
    </>
  );
};

export default Home;


// // src/app/(root)/page.tsx
// import React from "react";
// import { getCurrentUser } from "@/lib/auth/actions";
// import { getAllProducts } from "@/lib/actions/product";
// import { getActiveHeroSlides } from "@/lib/actions/hero-slides";
// import HeroSection from "@/components/home/hero-section";
// import LatestProductsSection from "@/components/home/latest-products";
// import { HeroSlide } from "@/components/home/hero-carousel";
// import { getHeroSlideLink } from "@/lib/utils/hero-slides";
// import CategoriesSection from "@/components/home/categories-section";

// const Home = async () => {
//   const user = await getCurrentUser();
//   const { products } = await getAllProducts({ limit: 4 });
  
//   // Single query fetches slides WITH linked product/collection data!
//   const heroSlidesData = await getActiveHeroSlides();

//   // Transform to carousel format - NO additional queries needed!
//   const desktopHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
//     type: slide.desktopMediaType as 'image' | 'video',
//     src: slide.desktopMediaUrl,
//     linkUrl: getHeroSlideLink(slide), // Pure function, no DB query
//     altText: slide.altText || undefined,
//   }));

//   const mobileHeroSlides: HeroSlide[] = heroSlidesData.map((slide) => ({
//     type: slide.mobileMediaType as 'image' | 'video',
//     src: slide.mobileMediaUrl,
//     linkUrl: getHeroSlideLink(slide), // Pure function, no DB query
//     altText: slide.altText || undefined,
//   }));

//   // Fallback to static slides if no database slides exist
//   const hasSlides = desktopHeroSlides.length > 0;

//   const finalDesktopSlides = hasSlides ? desktopHeroSlides : [
//     {
//       type: 'image' as const,
//       src: '/hero-banners/1.webp',
//     },
//   ];

//   const finalMobileSlides = hasSlides ? mobileHeroSlides : [
//     {
//       type: 'image' as const,
//       src: '/hero-banners/mobile-1.webp',
//     },
//   ];


//   console.log('products: ', JSON.stringify(products, null, 2))

//   return (
//     <>
//       <HeroSection
//         desktopSlides={finalDesktopSlides}
//         mobileSlides={finalMobileSlides}
//       />
//       <CategoriesSection />
//       <LatestProductsSection products={products} />
//     </>
//   );
// };

// export default Home;