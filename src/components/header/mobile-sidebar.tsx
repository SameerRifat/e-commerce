// src/components/header/mobile-sidebar.tsx
"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavLink {
  label: string;
  href: string;
}

interface MobileSidebarProps {
  userSection: ReactNode; // Receives the suspended UserSection
  navLinks: readonly NavLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export default function MobileSidebar({
  userSection,
  navLinks,
  open,
  onOpenChange,
  trigger,
}: MobileSidebarProps) {
  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[380px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="text-lg font-semibold text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* ✅ User section with its own loading state */}
          <div className="px-6 py-5 bg-muted/30">
            {userSection}
          </div>

          {/* Navigation Links - STATIC */}
          <nav className="px-3 py-4">
            <div className="space-y-1">
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Shop
              </p>
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="w-full justify-start h-11 px-3 text-sm font-medium hover:bg-accent"
                  asChild
                >
                  <Link href={link.href} onClick={handleLinkClick}>
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}