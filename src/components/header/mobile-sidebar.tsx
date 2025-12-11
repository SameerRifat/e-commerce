// src/components/header/mobile-sidebar.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface MobileSidebarProps {
  navLinks: readonly NavLink[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export default function MobileSidebar({
  navLinks,
  open,
  onOpenChange,
  trigger,
}: MobileSidebarProps) {
  const [openCollapsibles, setOpenCollapsibles] = useState<Set<string>>(
    new Set()
  );

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  const toggleCollapsible = (label: string) => {
    setOpenCollapsibles((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[380px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="text-lg font-semibold text-left">
            Menu
          </SheetTitle>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Shop
            </p>
            {navLinks.map((link) =>
              link.children && link.children.length > 0 ? (
                // Nested navigation with accordion
                <Collapsible
                  key={link.label}
                  open={openCollapsibles.has(link.label)}
                  onOpenChange={() => toggleCollapsible(link.label)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between h-11 px-3 text-sm font-medium hover:bg-accent"
                    >
                      <span>{link.label}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          openCollapsibles.has(link.label) ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 pt-1 space-y-1">
                    {link.children.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        className="w-full justify-start h-10 px-3 text-sm hover:bg-accent"
                        asChild
                      >
                        <Link href={child.href} onClick={handleLinkClick}>
                          {child.label}
                        </Link>
                      </Button>
                    ))}
                    {/* Browse All link */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-10 px-3 text-sm font-medium hover:bg-accent"
                      asChild
                    >
                      <Link href={link.href} onClick={handleLinkClick}>
                        Browse All {link.label}
                      </Link>
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                // Simple link
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
              )
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}