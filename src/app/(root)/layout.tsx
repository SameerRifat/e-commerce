// src/app/(root)/layout.tsx
import { Suspense } from "react";
import CartInitializer from "@/components/CartInitializer";
import Footer from "@/components/footer";
import Navbar from "@/components/header/navbar";
import TopBar from "@/components/header/top-bar";
import { getCurrentUser } from "@/lib/auth/actions";
import { NavbarErrorBoundary } from "./error-boundaries/navbar-error-boundary";
import { UserSection } from "@/components/header/user-section";
import { UserSectionSkeleton } from "@/components/header/user-section-skeleton";

export const dynamic = 'force-dynamic';

// Separate server component that fetches ONLY user data
async function UserSectionWithData() {
  const user = await getCurrentUser();
  return <UserSection user={user} />;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CartInitializer />
      <TopBar />
      {/* ✅ Navbar renders immediately with all static content */}
      <NavbarErrorBoundary>
        <Navbar>
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