// src/components/header/mobile-sidebar.tsx
"use client";

import Link from "next/link";
import { User as UserIcon, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import SignOutButton from "@/components/auth/sign-out-button";

interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
}

interface NavLink {
  label: string;
  href: string;
}

interface MobileSidebarProps {
  user: User | null;
  navLinks: readonly NavLink[];
  itemCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function MobileSidebar({
  user,
  navLinks,
  itemCount,
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
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b">
          <SheetTitle className="text-lg font-semibold text-left">Menu</SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* User Profile Section */}
          {user && (
            <div className="px-6 py-5 bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-background">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
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

            {/* User Account Section */}
            {user ? (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Account
                  </p>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 text-sm font-medium hover:bg-accent"
                    asChild
                  >
                    <Link href="/profile" onClick={handleLinkClick}>
                      <UserIcon className="mr-3 h-4 w-4" />
                      My Profile
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 text-sm font-medium hover:bg-accent"
                    asChild
                  >
                    <Link href="/orders" onClick={handleLinkClick}>
                      <Package className="mr-3 h-4 w-4" />
                      Order History
                    </Link>
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 px-3 text-sm font-medium hover:bg-accent"
                    asChild
                  >
                    <Link href="/dashboard" onClick={handleLinkClick}>
                      <Home className="mr-3 h-4 w-4" />
                      Dashboard
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Separator className="my-4" />
                <div className="px-3">
                  <Button
                    variant="default"
                    className="w-full h-11 font-medium"
                    asChild
                  >
                    <Link href="/sign-in" onClick={handleLinkClick}>
                      Sign In
                    </Link>
                  </Button>
                  <p className="mt-3 text-xs text-center text-muted-foreground">
                    New customer?{" "}
                    <Link 
                      href="/sign-up" 
                      className="text-primary hover:underline font-medium"
                      onClick={handleLinkClick}
                    >
                      Create an account
                    </Link>
                  </p>
                </div>
              </>
            )}
          </nav>
        </div>

        {/* Footer - Sign Out */}
        {user && (
          <div className="border-t px-6 py-4 bg-muted/20">
            <SignOutButton
              className="w-full justify-center h-11 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              onSuccess={handleLinkClick}
            >
              Sign Out
            </SignOutButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}