// src/components/Navbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, Menu, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [open, setOpen] = useState(false);
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
        className="custom_container flex h-16 items-center justify-between"
        aria-label="Primary navigation"
      >
        {/* Logo */}
        <Link href="/" aria-label="Nike Home" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Nike Logo"
            width={28}
            height={28}
            priority
            className="invert"
          />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-body text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            aria-label="Search products"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
          </Button>

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
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
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

        {/* Mobile Menu Toggle */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            {/* Mobile User Info */}
            {user && (
              <div className="flex items-center gap-3 py-4 border-b">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image || undefined} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <nav className="flex flex-col gap-2 py-4">
              {NAV_LINKS.map((link) => (
                <Button
                  key={link.href}
                  variant="ghost"
                  className="justify-start"
                  asChild
                >
                  <Link href={link.href} onClick={() => setOpen(false)}>
                    {link.label}
                  </Link>
                </Button>
              ))}

              <div className="border-t my-2" />

              {/* Mobile Actions */}
              <Button
                variant="ghost"
                className="justify-start gap-2"
                onClick={() => setOpen(false)}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>

              <Button
                variant="ghost"
                className="justify-start gap-2"
                asChild
              >
                <Link href="/cart" onClick={() => setOpen(false)}>
                  <div className="relative">
                    <ShoppingBag className="h-4 w-4" />
                    {itemCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 min-w-[1rem] px-1 flex items-center justify-center text-[9px]"
                      >
                        {itemCount > 9 ? "9+" : itemCount}
                      </Badge>
                    )}
                  </div>
                  Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
              </Button>

              {user ? (
                <>
                  <div className="border-t my-2" />
                  <Button
                    variant="ghost"
                    className="justify-start gap-2"
                    asChild
                  >
                    <Link href="/profile" onClick={() => setOpen(false)}>
                      <UserIcon className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start gap-2"
                    asChild
                  >
                    <Link href="/orders" onClick={() => setOpen(false)}>
                      <ShoppingBag className="h-4 w-4" />
                      Orders
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="justify-start"
                    asChild
                  >
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <div className="border-t my-2" />
                  <SignOutButton
                    className="justify-start text-destructive w-full text-left px-4 py-2 hover:bg-accent rounded-md"
                    onSuccess={() => setOpen(false)}
                  >
                    Sign Out
                  </SignOutButton>
                </>
              ) : (
                <>
                  <div className="border-t my-2" />
                  <Button
                    variant="default"
                    className="w-full"
                    asChild
                  >
                    <Link href="/sign-in" onClick={() => setOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}


// // src/components/Navbar.tsx
// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { useState } from "react";
// import { Search, ShoppingBag } from "lucide-react";
// import { useCartStore } from "@/store/cart";

// interface User {
//   id: string;
//   email: string;
//   emailVerified: boolean;
//   name: string;
//   createdAt: Date;
//   updatedAt: Date;
//   image?: string | null | undefined;
// }

// const NAV_LINKS = [
//   { label: "Men", href: "/products?gender=men" },
//   { label: "Women", href: "/products?gender=women" },
//   { label: "Kids", href: "/products?gender=unisex" },
//   { label: "Collections", href: "/collections" },
//   { label: "Contact", href: "/contact" },
// ] as const;

// export default function Navbar({ user }: { user: User | null }) {
//   const [open, setOpen] = useState(false);
//   const { getItemCount, toggleCart } = useCartStore();

//   const itemCount = getItemCount();

//   // console.log('[Navbar] USER:', JSON.stringify(user, null, 2));

//   return (
//     <header className="sticky top-0 z-50 bg-background border-b border-border">
//       <nav
//         className="custom_container flex h-16 items-center justify-between"
//         aria-label="Primary"
//       >
//         <Link href="/" aria-label="Cosmetics Home" className="flex items-center">
//           <Image src="/logo.svg" alt="Logo" width={28} height={28} priority className="invert" />
//         </Link>

//         <ul className="hidden items-center gap-8 md:flex">
//           {NAV_LINKS.map((l) => (
//             <li key={l.href}>
//               <Link
//                 href={l.href}
//                 className="text-body text-foreground transition-colors hover:text-foreground"
//               >
//                 {l.label}
//               </Link>
//             </li>
//           ))}
//         </ul>

//         <div className="hidden items-center gap-6 md:flex">
//           <button
//             className="flex items-center gap-2 text-body text-foreground transition-colors hover:text-foreground"
//             aria-label="Search products"
//           >
//             <Search className="h-4 w-4" />
//             <span className="hidden lg:inline">Search</span>
//           </button>

//           <Link
//             href='/cart'
//             className="flex items-center gap-2 text-body text-dark-900 transition-colors hover:text-dark-700 relative"
//             aria-label={`Open cart with ${itemCount} items`}
//           >
//             <div className="relative">
//               <ShoppingBag className="h-5 w-5" />
//               {itemCount > 0 && (
//                 <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[1.25rem]">
//                   {itemCount > 99 ? '99+' : itemCount}
//                 </span>
//               )}
//             </div>
//             <span className="hidden lg:inline">
//               My Cart
//             </span>
//           </Link>

//           {user ? (
//             <Link href="/profile" className="flex items-center gap-2">
//               {user.image ? (
//                 <Image
//                   src={user.image}
//                   alt={user.name}
//                   width={32}
//                   height={32}
//                   className="rounded-full"
//                 />
//               ) : (
//                 <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
//                   <span className="text-sm font-medium text-gray-700">
//                     {user.name.charAt(0).toUpperCase()}
//                   </span>
//                 </div>
//               )}
//               <span className="text-sm text-dark-900">{user.name}</span>
//             </Link>
//           ) : (
//             <Link href="/sign-in" className="text-body text-dark-900 transition-colors hover:text-dark-700">Sign In</Link>
//           )}

//           <Link href="/dashboard" className="text-body text-dark-900 transition-colors hover:text-dark-700">
//             Dashboard
//           </Link>
//         </div>

//         <button
//           type="button"
//           className="inline-flex items-center justify-center rounded-md p-2 md:hidden"
//           aria-controls="mobile-menu"
//           aria-expanded={open}
//           onClick={() => setOpen((v) => !v)}
//         >
//           <span className="sr-only">Toggle navigation</span>
//           <span className="mb-1 block h-0.5 w-6 bg-dark-900"></span>
//           <span className="mb-1 block h-0.5 w-6 bg-dark-900"></span>
//           <span className="block h-0.5 w-6 bg-dark-900"></span>
//         </button>
//       </nav>

//       <div
//         id="mobile-menu"
//         className={`border-t border-light-300 md:hidden ${open ? "block" : "hidden"}`}
//       >
//         <ul className="space-y-2 px-4 py-3">
//           {NAV_LINKS.map((l) => (
//             <li key={l.href}>
//               <Link
//                 href={l.href}
//                 className="block py-2 text-body text-dark-900 hover:text-dark-700"
//                 onClick={() => setOpen(false)}
//               >
//                 {l.label}
//               </Link>
//             </li>
//           ))}
//           <li className="flex items-center justify-between pt-2">
//             <button
//               className="flex items-center gap-2 text-body text-dark-900 hover:text-dark-700"
//               aria-label="Search products"
//             >
//               <Search className="h-4 w-4" />
//               Search
//             </button>

//             <Link
//               href='/cart'
//               className="flex items-center gap-2 text-body text-dark-900 hover:text-dark-700 border-2 border-red-500"
//               aria-label={`Open cart with ${itemCount} items`}
//             >
//               <div className="relative">
//                 <ShoppingBag className="h-4 w-4" />
//                 {itemCount > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium text-[10px]">
//                     {itemCount > 9 ? '9+' : itemCount}
//                   </span>
//                 )}
//               </div>
//               My Cart {itemCount > 0 && `(${itemCount})`}
//             </Link>

//             <Link
//               href="/dashboard"
//               className="text-body text-dark-900 hover:text-dark-700"
//               onClick={() => setOpen(false)}
//             >
//               Dashboard
//             </Link>
//           </li>
//           {user && (
//             <li className="pt-2 border-t border-light-300">
//               <Link href="/profile" className="flex items-center gap-2">
//                 {user.image ? (
//                   <Image
//                     src={user.image}
//                     alt={user.name}
//                     width={24}
//                     height={24}
//                     className="rounded-full"
//                   />
//                 ) : (
//                   <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
//                     <span className="text-xs font-medium text-gray-700">
//                       {user.name.charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                 )}
//                 <span className="text-sm text-dark-900">{user.name}</span>
//               </Link>
//             </li>
//           )}
//         </ul>
//       </div>
//     </header>
//   );
// }