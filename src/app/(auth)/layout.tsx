// src/app/(auth)/layout.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/actions";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Check if user is already logged in
  const user = await getCurrentUser();

  if (user) {
    // Redirect logged-in users to appropriate page
    if (user.role === "admin") {
      redirect("/dashboard");
    } else {
      redirect("/");
    }
  }

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Section - Brand Experience */}
      <section className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E47F1A]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E47F1A]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]" />

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#E47F1A] to-amber-600 inline-flex items-center justify-center shadow-2xl shadow-[#E47F1A]/50 ring-1 ring-white/10">
              <Image
                src="/logo.svg"
                alt="Brand Logo"
                width={28}
                height={28}
                className="filter brightness-0 invert"
              />
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="space-y-8 max-w-lg">
            <div className="inline-block px-5 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-[#E47F1A]/30 shadow-lg">
              <span className="text-sm font-medium text-[#E47F1A]">
                ✨ Beauty Redefined
              </span>
            </div>

            <h2 className="text-6xl font-bold leading-tight text-white">
              Discover Your
              <span className="block mt-2 bg-gradient-to-r from-[#E47F1A] via-amber-500 to-[#E47F1A] bg-clip-text text-transparent">
                Natural Glow
              </span>
            </h2>

            <p className="text-xl text-slate-300 leading-relaxed max-w-md">
              Join thousands of beauty enthusiasts who trust us for premium skincare,
              cosmetics, and personalized beauty solutions.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3 pt-4">
              <div className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 group">
                <div className="w-2 h-2 rounded-full bg-[#E47F1A] group-hover:scale-110 transition-transform shadow-sm shadow-[#E47F1A]/50" />
                <span className="text-sm font-medium text-slate-200">Premium Products</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 group">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#E47F1A] to-amber-500 group-hover:scale-110 transition-transform shadow-sm shadow-[#E47F1A]/50" />
                <span className="text-sm font-medium text-slate-200">Expert Guidance</span>
              </div>
              <div className="flex items-center gap-2 px-5 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 group">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-[#E47F1A] group-hover:scale-110 transition-transform shadow-sm shadow-[#E47F1A]/50" />
                <span className="text-sm font-medium text-slate-200">Fast Delivery</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">© 2025 Your Brand. All rights reserved.</p>
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 cursor-pointer group">
                <span className="text-lg group-hover:scale-110 transition-transform">🌸</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 cursor-pointer group">
                <span className="text-lg group-hover:scale-110 transition-transform">💄</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#E47F1A]/40 transition-all duration-300 cursor-pointer group">
                <span className="text-lg group-hover:scale-110 transition-transform">✨</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section - Auth Form */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}