// src/app/(root)/page.tsx
import { Suspense } from "react";
import type { Metadata } from "next";
import { HeroSectionData } from "./_components/hero-section-data";
import { CategoriesSectionData } from "./_components/categories-section-data";
import { FeaturedCollectionsSectionData } from "./_components/featured-collections-section-data";
import { LatestProductsSectionData } from "./_components/latest-products-section-data";
import FeaturesSection from "@/components/home/features-section";
import { HeroSkeleton } from "@/components/loading/hero-skeleton";
import { CategoriesSkeleton } from "@/components/loading/categories-skeleton";
import { ProductsSkeleton } from "@/components/loading/products-skeleton";
import { HeroErrorBoundary } from "./error-boundaries/hero-error-boundary";
import { SectionErrorBoundary } from "./error-boundaries/section-error-boundary";
import { VideoCarouselSectionData } from "./_components/video-carousel-section-data";
import VideoCarouselSkeleton from "@/components/loading/video-carousel-skeleton";
import FeaturedCollectionsSkeleton from "@/components/loading/collections-skeleton";
import { generateOrganizationSchema, generateWebSiteSchema } from "@/lib/utils/json-ld";

export const metadata: Metadata = {
  title: "Premium Cosmetics & Beauty Products - Discover Your Natural Glow",
  description: "Shop premium cosmetics, skincare, and beauty products. Discover our curated collections of makeup, skincare, and beauty essentials. Free shipping on orders over Rs. 3000.",
  keywords: [
    "cosmetics online",
    "beauty products pakistan",
    "skincare",
    "makeup",
    "beauty store online",
    "premium cosmetics",
    "buy cosmetics online",
  ],
  openGraph: {
    title: "Cosmeticspk - Premium Cosmetics & Beauty Products",
    description: "Discover Your Natural Glow. Shop premium skincare, makeup, and beauty products from top brands.",
    url: "/",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cosmeticspk Homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmeticspk - Premium Cosmetics & Beauty Products",
    description: "Discover Your Natural Glow. Shop premium skincare, makeup, and beauty products from top brands.",
    images: ["/og-image.jpg"],
  },
};

export default function Home() {
  // Generate JSON-LD structured data for homepage
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* Hero Section - Independent loading with error boundary */}
      <HeroErrorBoundary>
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSectionData />
        </Suspense>
      </HeroErrorBoundary>

      <div className="py-10 sm:py-12 md:py-14 flex flex-col gap-10 sm:gap-12 md:gap-16 2xl:gap-20">
        {/* Categories Section - Independent loading with error boundary */}
        <SectionErrorBoundary title="Failed to load categories">
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesSectionData />
          </Suspense>
        </SectionErrorBoundary>

        {/* Featured Collections Section - Independent loading with error boundary */}
        <SectionErrorBoundary title="Failed to load collections">
          <Suspense fallback={<FeaturedCollectionsSkeleton />}>
            <FeaturedCollectionsSectionData />
          </Suspense>
        </SectionErrorBoundary>

        {/* Video Carousel Section - Independent loading with error boundary */}
        <SectionErrorBoundary title="Failed to load video carousel">
          <Suspense fallback={<VideoCarouselSkeleton />}>
            <VideoCarouselSectionData />
          </Suspense>
        </SectionErrorBoundary>

        {/* Products Section - Independent loading with error boundary */}
        <SectionErrorBoundary title="Failed to load products">
          <Suspense fallback={<ProductsSkeleton />}>
            <LatestProductsSectionData />
          </Suspense>
        </SectionErrorBoundary>

        {/* Features Section - Static, no Suspense or error boundary needed */}
        <FeaturesSection />
      </div>
    </>
  );
}