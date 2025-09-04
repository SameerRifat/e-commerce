// src/app/(root)/layout.tsx
import { Navbar, Footer } from "@/components";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <Navbar user={user} />
      {children}
      <Footer />
    </>
  );
}
