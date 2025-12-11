// src/app/dashboard/video-carousel/[id]/edit/page.tsx
import React from "react";
import { notFound } from "next/navigation";
import { getVideoCarouselItemById } from "@/lib/actions/video-carousel-items";
import VideoCarouselItemForm from "@/components/dashboard/video-carousel/video-carousel-item-form";

interface EditVideoCarouselItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditVideoCarouselItemPage({
  params,
}: EditVideoCarouselItemPageProps) {
  const { id } = await params;
  const result = await getVideoCarouselItemById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <VideoCarouselItemForm mode="edit" initialData={result.data} />;
}
