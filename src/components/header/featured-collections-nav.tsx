// src/components/header/featured-collections-nav.tsx
import { getFeaturedCollections } from "@/lib/actions/collections";

/**
 * Server component that fetches featured collections for navigation
 * Returns data in format needed by both desktop dropdown and mobile accordion
 */
export async function FeaturedCollectionsNav() {
  const collections = await getFeaturedCollections();

  return {
    collections: collections.map((collection) => ({
      name: collection.name,
      slug: collection.slug,
      href: `/collections/${collection.slug}`,
    })),
  };
}

export type CollectionNavItem = {
  name: string;
  slug: string;
  href: string;
};
