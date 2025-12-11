// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import OAuthCallbackHandler from "@/components/auth/oauth-callback-handler";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Cosmeticspk",
  description: "Discover Your Natural Glow, Join thousands of beauty enthusiasts who trust us for premium skincare, cosmetics, and personalized beauty solutions.",
};

export default function RootShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
      <NextTopLoader
          // color="#e17100"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
        />
        <OAuthCallbackHandler />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}