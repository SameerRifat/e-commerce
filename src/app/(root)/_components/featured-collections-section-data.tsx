// src/app/(root)/_components/featured-collections-section-data.tsx
import { getFeaturedCollections } from "@/lib/actions/collections";
import FeaturedCollectionsSection from "@/components/home/featured-collections-section";

/**
 * Server component that fetches and displays featured collections
 * Only shows collections marked with isFeatured = true
 */
export async function FeaturedCollectionsSectionData() {
  const collections = await getFeaturedCollections();

  // Don't render section if no featured collections
  if (collections.length === 0) {
    return null;
  }

  return <FeaturedCollectionsSection collections={collections} />;
}
