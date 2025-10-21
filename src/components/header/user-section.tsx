// src/components/header/user-section.tsx
"use client";

import Link from "next/link";
import { User as UserIcon, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SignOutButton from "@/components/auth/sign-out-button";

interface User {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    image?: string | null | undefined;
    role?: string | null;
}

interface UserSectionProps {
    user: User | null;
}

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export function UserSection({ user }: UserSectionProps) {
    if (!user) {
        return (
            <Button variant="default" size="sm" asChild className="text-xs sm:text-sm px-2.5 sm:px-3.5 h-7 sm:!h-9">
                <Link href="/sign-in">Sign In</Link>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="secondary"
                    // size="sm"
                    className="gap-2 !p-0 lg:!px-4 lg:!py-2 rounded-full lg:rounded-md h-fit lg:h-9"
                    aria-label="User menu"
                >
                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                        <AvatarImage src={user.image || undefined} alt={user.name} className="object-cover"/>
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
                        <p className="text-xs text-muted-foreground line-clamp-1">{user.email}</p>
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
                    <Link href="/profile/orders" className="cursor-pointer">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Orders
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profile/addresses" className="cursor-pointer">
                        <MapPin className="mr-2 h-4 w-4" />
                        Addresses
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
    );
}