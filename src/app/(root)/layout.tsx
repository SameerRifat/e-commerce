// src/app/(root)/layout.tsx
import { Navbar, Footer } from "@/components";
import CartSidebar from "@/components/cart/CartSidebar";
import CartInitializer from "@/components/CartInitializer";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <>
      <CartInitializer />
      <Navbar user={user} />
      {children}
      <Footer />
      <CartSidebar />
    </>
  );
}