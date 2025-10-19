// src/app/(root)/page.tsx
import { Suspense } from "react";
import { HeroSectionData } from "./_components/hero-section-data";
import { CategoriesSectionData } from "./_components/categories-section-data";
import { LatestProductsSectionData } from "./_components/latest-products-section-data";
import FeaturesSection from "@/components/home/features-section";
import { HeroSkeleton } from "@/components/loading/hero-skeleton";
import { CategoriesSkeleton } from "@/components/loading/categories-skeleton";
import { ProductsSkeleton } from "@/components/loading/products-skeleton";
import { HeroErrorBoundary } from "./error-boundaries/hero-error-boundary";
import { SectionErrorBoundary } from "./error-boundaries/section-error-boundary";

export default function Home() {
  return (
    <>
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