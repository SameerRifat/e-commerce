// src/app/(root)/layout.tsx
import CartInitializer from "@/components/CartInitializer";
import Footer from "@/components/footer";
import Navbar from "@/components/header/navbar";
import TopBar from "@/components/header/top-bar";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  console.log('USER:', JSON.stringify(user, null, 2));

  return (
    <>
      <CartInitializer />
      <TopBar />
      <Navbar user={user} />
      {children}
      <Footer />
    </>
  );
}