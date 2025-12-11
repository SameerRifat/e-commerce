// src/components/header/collections-dropdown.tsx
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { CollectionNavItem } from "./featured-collections-nav";

interface CollectionsDropdownProps {
  collections: CollectionNavItem[];
}

/**
 * Desktop collections dropdown menu
 * Click-to-open pattern with keyboard navigation support
 * Industry standard: Simple dropdown (not mega menu) for <8 items
 */
export function CollectionsDropdown({ collections }: CollectionsDropdownProps) {
  if (collections.length === 0) {
    // Fallback to simple link if no featured collections
    return (
      <Link
        href="/collections"
        className="text-sm text-foreground transition-colors hover:text-primary whitespace-nowrap"
      >
        Collections
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto p-0 text-sm font-normal text-foreground hover:text-primary hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Collections
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {collections.map((collection) => (
          <DropdownMenuItem key={collection.slug} asChild>
            <Link
              href={collection.href}
              className="cursor-pointer flex items-center justify-between"
            >
              <span>{collection.name}</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          </DropdownMenuItem>
        ))}

        {collections.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/collections"
                className="cursor-pointer font-medium"
              >
                Browse All Collections
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
