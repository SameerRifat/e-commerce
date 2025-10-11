// src/app/dashboard/hero-slides/new/page.tsx
import HeroSlideForm from "@/components/dashboard/hero-slides/hero-slide-form";
import React from "react";

/**
 * OPTIMIZED: No data fetching on page load
 * Data is fetched on-demand when user selects link type and opens the combobox
 */
const NewHeroSlidePage = () => {
  return <HeroSlideForm mode="create" />;
};

export default NewHeroSlidePage;

// // src/app/dashboard/hero-slides/new/page.tsx
// import React, { Suspense } from "react";
// import HeroSlideForm from "@/components/dashboard/hero-slides/hero-slide-form";
// import { db } from "@/lib/db";
// import { products, collections } from "@/lib/db/schema";
// import { eq } from "drizzle-orm";
// import LoadingState from "@/components/ui/loading-state";

// const NewHeroSlidePage = async () => {
//   // Fetch published products and collections for linking
//   const [productsData, collectionsData] = await Promise.all([
//     db
//       .select({ id: products.id, name: products.name })
//       .from(products)
//       .where(eq(products.isPublished, true))
//       .limit(100),
//     db
//       .select({ id: collections.id, name: collections.name })
//       .from(collections)
//       .limit(100),
//   ]);

//   return (
//     <HeroSlideForm
//       mode="create"
//       products={productsData}
//       collections={collectionsData}
//     />
//   );
// };

// export default function NewHeroSlidePageWithSuspense() {
//   return (
//     <Suspense fallback={<LoadingState size="lg" message="Loading form..." />}>
//       <NewHeroSlidePage />
//     </Suspense>
//   );
// }