// src/components/header/navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, Menu, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCartStore } from "@/store/cart";
import SignOutButton from "@/components/auth/sign-out-button";
import MobileSidebar from "./mobile-sidebar";
import { PersistentSearch, MobileSearchOverlay } from "./search-input";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined;
}

const NAV_LINKS = [
    { label: "Men", href: "/products?gender=men" },
    { label: "Women", href: "/products?gender=women" },
    { label: "Kids", href: "/products?gender=unisex" },
    { label: "Collections", href: "/collections" },
    { label: "Contact", href: "/contact" },
] as const;

export default function Navbar({ user }: { user: User | null }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const { getItemCount } = useCartStore();

    const itemCount = getItemCount();

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="sticky top-0 z-50 bg-background border-b border-border">
            <nav
                className="custom_container flex h-16 items-center gap-4 lg:gap-6"
                aria-label="Primary navigation"
            >
                {/* Logo */}
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

                {/* Desktop Navigation Links */}
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

                {/* Desktop Search - Takes available space */}
                <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-auto">
                    <PersistentSearch className="w-full max-w-xl" />
                </div>

                {/* Desktop Actions */}
                <div className="hidden items-center gap-3 md:flex flex-shrink-0">
                    {/* Cart Link */}
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="relative gap-2"
                    >
                        <Link href="/cart" aria-label={`Cart with ${itemCount} items`}>
                            <div className="relative">
                                <ShoppingBag className="h-5 w-5" />
                                {itemCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-5 min-w-[1.25rem] px-1 flex items-center justify-center text-[10px] pointer-events-none"
                                    >
                                        {itemCount > 99 ? "99+" : itemCount}
                                    </Badge>
                                )}
                            </div>
                            <span className="hidden lg:inline">Cart</span>
                        </Link>
                    </Button>

                    {/* User Menu or Sign In */}
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    aria-label="User menu"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.image || undefined} alt={user.name} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden lg:inline text-sm">{user.name}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/orders" className="cursor-pointer">
                                        <ShoppingBag className="mr-2 h-4 w-4" />
                                        Orders
                                    </Link>
                                </DropdownMenuItem>
                                {user?.role === "admin" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard" className="cursor-pointer">
                                                Dashboard
                                            </Link>
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <SignOutButton className="w-full text-left text-destructive cursor-pointer flex items-center">
                                        Sign Out
                                    </SignOutButton>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant="default" size="sm" asChild>
                            <Link href="/sign-in">Sign In</Link>
                        </Button>
                    )}
                </div>

                {/* Mobile Actions - Auto pushed to right */}
                <div className="flex items-center gap-2 md:hidden ml-auto">
                    {/* Mobile Search */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileSearchOpen(true)}
                        aria-label="Search products"
                    >
                        <Search className="h-5 w-5" />
                    </Button>

                    {/* Mobile Cart */}
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="relative"
                    >
                        <Link href="/cart" aria-label={`Cart with ${itemCount} items`}>
                            <div className="relative">
                                <ShoppingBag className="h-5 w-5" />
                                {itemCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-2 -right-2 h-4 min-w-[1rem] px-1 flex items-center justify-center text-[9px] pointer-events-none"
                                    >
                                        {itemCount > 9 ? "9+" : itemCount}
                                    </Badge>
                                )}
                            </div>
                        </Link>
                    </Button>

                    {/* Mobile Menu Toggle */}
                    <MobileSidebar
                        user={user}
                        navLinks={NAV_LINKS}
                        itemCount={itemCount}
                        open={mobileMenuOpen}
                        onOpenChange={setMobileMenuOpen}
                        trigger={
                            <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Toggle menu"
                            >
                                <Menu className="h-5 w-5" />
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