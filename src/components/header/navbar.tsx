"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Search, ShoppingBag, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart";
import MobileSidebar from "./mobile-sidebar";
import { PersistentSearch, MobileSearchOverlay } from "./search-input";

const NAV_LINKS = [
    { label: "Men", href: "/products?gender=men" },
    { label: "Women", href: "/products?gender=women" },
    { label: "Kids", href: "/products?gender=unisex" },
    { label: "Collections", href: "/collections" },
] as const;

interface NavbarProps {
    children: ReactNode; // This will be the suspended UserSection
}

export default function Navbar({ children }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const { getItemCount } = useCartStore();

    const itemCount = getItemCount();

    return (
        <header className="sticky top-0 z-50 bg-background border-b border-border">
            <nav
                className="custom_container flex h-[54px] sm:h-16 items-center gap-4 lg:gap-6"
                aria-label="Primary navigation"
            >
                {/* Logo - STATIC, renders immediately */}
                <Link href="/" aria-label="Nike Home" className="flex items-center flex-shrink-0">
                    <Image
                        src="/logo.svg"
                        alt="Nike Logo"
                        width={28}
                        height={28}
                        priority
                        className="invert"
                    />
                </Link>

                {/* Desktop Navigation Links - STATIC, renders immediately */}
                <ul className="hidden items-center gap-6 lg:gap-8 md:flex flex-shrink-0 ml-4">
                    {NAV_LINKS.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="text-sm text-foreground transition-colors hover:text-primary whitespace-nowrap"
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Desktop Search - STATIC, renders immediately */}
                <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
                    <PersistentSearch className="w-full max-w-xl" />
                </div>

                {/* Desktop & Mobile Actions */}
                <div className="flex items-center gap-4 xl:gap-5 2xl:gap-6 ml-auto flex-shrink-0">
                    {/* Mobile Search - STATIC, hidden on desktop */}
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setMobileSearchOpen(true)}
                        aria-label="Search products"
                        className="rounded-full sm:rounded-md md:hidden size-8"
                    >
                        <Search />
                    </Button>

                    {/* Cart - visible on all sizes */}
                    <Button
                        variant="secondary"
                        size="icon"
                        asChild
                        className="!rounded-full sm:!rounded-md size-8 sm:size-9"
                    >
                        <Link href="/cart" aria-label={`Cart with ${itemCount} items`} className="">
                            <div className="relative">
                                <ShoppingBag />
                                {itemCount > 0 && (
                                    <Badge
                                        className="absolute -top-3 -right-3 w-4 h-4 sm:w-5 sm:h-5 px-1 flex items-center justify-center text-[10px] sm:text-[11px] pointer-events-none font-medium"
                                    >
                                        {itemCount > 99 ? "99+" : itemCount}
                                    </Badge>
                                )}
                            </div>
                        </Link>
                    </Button>

                    {/* ✅ User Section - VISIBLE ON ALL SIZES (suspended component) */}
                    {children}

                    {/* Mobile Menu Trigger - navigation links only */}
                    <MobileSidebar
                        navLinks={NAV_LINKS}
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                        trigger={
                            <Button
                                variant="secondary"
                                size="icon"
                                aria-label="Toggle menu"
                                className="rounded-full sm:rounded-md md:hidden size-8"
                            >
                                <Menu />
                            </Button>
                        }
                    />
                </div>
            </nav>

            {/* Mobile Search Overlay */}
            <MobileSearchOverlay
                isOpen={mobileSearchOpen}
                onClose={() => setMobileSearchOpen(false)}
            />
        </header>
    );
}