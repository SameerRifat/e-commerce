// src/app/dashboard/layout.tsx
import { Suspense } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { getCurrentUser, checkIsAdmin } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { UserSectionSkeleton } from "@/components/header/user-section-skeleton";
import { AdminUserSection } from "@/components/dashboard/admin-user-section";

// Mark as dynamic for auth checks
export const dynamic = 'force-dynamic';

// Separate server component that fetches user data
async function DashboardUserSection() {
  const user = await getCurrentUser();
  return <AdminUserSection user={user} />;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?redirectTo=/dashboard");
  }

  const isAdmin = await checkIsAdmin();

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 bg-background border-b">
          <div className="custom_container flex h-[54px] sm:h-16 shrink-0 items-center justify-between gap-2">
            {/* Left side - Sidebar trigger */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4"
              />
            </div>

            {/* Right side - View Site & User Section */}
            <div className="flex items-center gap-3">
              {/* View Site Button */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1.5"
              >
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View live website"
                >
                  <span className="hidden sm:inline text-sm">View Site</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>

              {/* User Section */}
              <Suspense fallback={<UserSectionSkeleton />}>
                <DashboardUserSection />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-6 pb-8 sm:py-10 custom_container">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}