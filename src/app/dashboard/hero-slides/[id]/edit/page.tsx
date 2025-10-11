// ============================================
// src/app/dashboard/hero-slides/[id]/edit/page.tsx
// ============================================
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import HeroSlideForm from "@/components/dashboard/hero-slides/hero-slide-form";
import { db } from "@/lib/db";
import { heroSlides } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import LoadingState from "@/components/ui/loading-state";

interface EditHeroSlidePageProps {
  params: Promise<{
    id: string;
  }>;
}

const EditHeroSlidePage = async ({ params }: EditHeroSlidePageProps) => {
  const { id } = await params; 

  const [slide] = await db
    .select()
    .from(heroSlides)
    .where(eq(heroSlides.id, id))
    .limit(1);

  if (!slide) {
    notFound();
  }

  return <HeroSlideForm mode="edit" initialData={slide} />;
};

export default function EditHeroSlidePageWithSuspense({
  params,
}: EditHeroSlidePageProps) {
  return (
    <Suspense fallback={<LoadingState size="lg" message="Loading slide..." />}>
      <EditHeroSlidePage params={params} />
    </Suspense>
  );
}
