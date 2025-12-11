// src/app/dashboard/video-carousel/page.tsx
import React, { Suspense } from "react";
import { getAllVideoCarouselItems } from "@/lib/actions/video-carousel-items";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import LoadingState from "@/components/ui/loading-state";
import VideoCarouselItemsTable from "@/components/dashboard/video-carousel/video-carousel-items-table";

const VideoCarouselPage = async () => {
  const items = await getAllVideoCarouselItems();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Video Carousel"
        description="Manage homepage video carousel items"
        action={{
          label: "Add New Item",
          href: "/dashboard/video-carousel/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <VideoCarouselItemsTable items={items} />
    </div>
  );
};

export default function VideoCarouselPageWithSuspense() {
  return (
    <Suspense fallback={<LoadingState size="lg" message="Loading video carousel items..." />}>
      <VideoCarouselPage />
    </Suspense>
  );
}
