// src/app/dashboard/collections/page.tsx
import React, { Suspense } from "react";
import { Plus } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import LoadingState from "@/components/ui/loading-state";
import CollectionsTable from "@/components/dashboard/collections/collections-table";
import { getAllCollections } from "@/lib/actions/collections";

const CollectionsPage = async () => {
  const collections = await getAllCollections();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collections"
        description="Curate product collections for marketing campaigns and seasonal promotions"
        action={{
          label: "Add Collection",
          href: "/dashboard/collections/new",
          icon: <Plus className="h-4 w-4" />,
        }}
      />

      <CollectionsTable collections={collections} />
    </div>
  );
};

export default function CollectionsPageWithSuspense() {
  return (
    <Suspense
      fallback={<LoadingState size="lg" message="Loading collections..." />}
    >
      <CollectionsPage />
    </Suspense>
  );
}