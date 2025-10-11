// src/app/dashboard/hero-slides/page.tsx
import React, { Suspense } from "react";
import { getAllHeroSlides } from "@/lib/actions/hero-slides";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import LoadingState from "@/components/ui/loading-state";
import HeroSlidesTable from "@/components/dashboard/hero-slides/hero-slides-table";

const HeroSlidesPage = async () => {
  const slides = await getAllHeroSlides();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hero Slides"
        description="Manage homepage hero carousel slides"
        action={{
          label: "Add New Slide",
          href: "/dashboard/hero-slides/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <HeroSlidesTable slides={slides} />
    </div>
  );
};

export default function HeroSlidesPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingState size="lg" message="Loading hero slides..." />}>
      <HeroSlidesPage />
    </Suspense>
  );
}