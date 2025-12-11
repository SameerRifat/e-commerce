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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cosmeticspk.com'),
  title: {
    default: "Cosmeticspk - Premium Cosmetics & Beauty Products",
    template: "%s | Cosmeticspk",
  },
  description: "Discover Your Natural Glow. Join thousands of beauty enthusiasts who trust us for premium skincare, cosmetics, and personalized beauty solutions.",
  keywords: [
    "cosmetics",
    "beauty products",
    "skincare",
    "makeup",
    "beauty store",
    "premium cosmetics",
    "natural beauty",
    "cosmetics pakistan",
  ],
  authors: [{ name: "Cosmeticspk" }],
  creator: "Cosmeticspk",
  publisher: "Cosmeticspk",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Cosmeticspk",
    title: "Cosmeticspk - Premium Cosmetics & Beauty Products",
    description: "Discover Your Natural Glow. Join thousands of beauty enthusiasts who trust us for premium skincare, cosmetics, and personalized beauty solutions.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cosmeticspk - Premium Beauty Products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cosmeticspk - Premium Cosmetics & Beauty Products",
    description: "Discover Your Natural Glow. Join thousands of beauty enthusiasts who trust us for premium skincare, cosmetics, and personalized beauty solutions.",
    images: ["/og-image.jpg"],
    creator: "@cosmeticspk",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification tokens when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
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