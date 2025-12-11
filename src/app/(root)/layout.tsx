// src/app/(root)/layout.tsx
import { Suspense } from "react";
import CartInitializer from "@/components/CartInitializer";
import Navbar from "@/components/header/navbar";
import TopBar from "@/components/header/top-bar";
import { getCurrentUser } from "@/lib/auth/actions";
import { getFeaturedCollections } from "@/lib/actions/collections";
import { NavbarErrorBoundary } from "./error-boundaries/navbar-error-boundary";
import { UserSection } from "@/components/header/user-section";
import { UserSectionSkeleton } from "@/components/header/user-section-skeleton";
import Footer from "@/components/footer";

export const dynamic = 'force-dynamic';

// Separate server component that fetches ONLY user data
async function UserSectionWithData() {
  const user = await getCurrentUser();
  return <UserSection user={user} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch featured collections for navbar (cached)
  const featuredCollections = await getFeaturedCollections();
  const collections = featuredCollections.map((collection) => ({
    name: collection.name,
    slug: collection.slug,
    href: `/collections/${collection.slug}`,
  }));

  return (
    <>
      <CartInitializer />
      <TopBar />
      {/* ✅ Navbar renders with featured collections */}
      <NavbarErrorBoundary>
        <Navbar collections={collections}>
          {/* ✅ Only user section is suspended */}
          <Suspense fallback={<UserSectionSkeleton />}>
            <UserSectionWithData />
          </Suspense>
        </Navbar>
      </NavbarErrorBoundary>
      {children}
      <Footer />
    </>
  );
}