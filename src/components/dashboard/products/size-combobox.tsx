// src/components/dashboard/products/size-combobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

// UPDATED: Size now includes nested category
export interface Size {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    categoryId?: string | null;
    category?: {
        id: string;
        name: string;
        createdAt?: Date;
    } | null;
}

// UPDATED: Removed SizeCategory interface and prop
interface SizeComboboxProps {
    sizes: Size[]; // Now includes nested category data
    value: string | null | undefined;
    onValueChange: (value: string | null) => void;
    placeholder?: string;
    emptyText?: string;
    disabled?: boolean;
    className?: string;
}

/**
 * A grouped size combobox component that organizes sizes by category
 * with built-in search functionality
 */
export const SizeCombobox: React.FC<SizeComboboxProps> = ({
    sizes,
    value,
    onValueChange,
    placeholder = "Select size",
    emptyText = "No size found",
    disabled = false,
    className,
}) => {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // SIMPLIFIED: Group sizes by category using nested data
    const groupedSizes = React.useMemo(() => {
        // Group sizes by category
        const groups = new Map<string, Size[]>();
        const uncategorized: Size[] = [];

        sizes.forEach((size) => {
            if (size.category) {
                const categoryId = size.category.id;
                if (!groups.has(categoryId)) {
                    groups.set(categoryId, []);
                }
                groups.get(categoryId)!.push(size);
            } else {
                uncategorized.push(size);
            }
        });

        // Sort sizes within each group by sortOrder
        groups.forEach((sizesInGroup) => {
            sizesInGroup.sort((a, b) => a.sortOrder - b.sortOrder);
        });
        uncategorized.sort((a, b) => a.sortOrder - b.sortOrder);

        // Convert to array format and sort categories by name
        const result = Array.from(groups.entries())
            .map(([categoryId, sizes]) => ({
                categoryId,
                categoryName: sizes[0].category!.name, // Get name from nested data
                sizes,
            }))
            .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

        // Add uncategorized at the end if exists
        if (uncategorized.length > 0) {
            result.push({
                categoryId: "uncategorized",
                categoryName: "Other Sizes",
                sizes: uncategorized,
            });
        }

        return result;
    }, [sizes]); // SIMPLIFIED: Only depends on sizes now!

    // Filter sizes based on search query
    const filteredGroups = React.useMemo(() => {
        if (!searchQuery.trim()) {
            return groupedSizes;
        }

        const query = searchQuery.toLowerCase();
        return groupedSizes
            .map((group) => ({
                ...group,
                sizes: group.sizes.filter((size) =>
                    size.name.toLowerCase().includes(query)
                ),
            }))
            .filter((group) => group.sizes.length > 0);
    }, [groupedSizes, searchQuery]);

    // Find selected size
    const selectedSize = React.useMemo(() => {
        return sizes.find((size) => size.id === value);
    }, [sizes, value]);

    // Handle selection
    const handleSelect = (sizeId: string) => {
        onValueChange(sizeId === value ? null : sizeId);
        setOpen(false);
        setSearchQuery(""); // Clear search on selection
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between", className)}
                >
                    <span className="truncate">
                        {selectedSize ? selectedSize.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search sizes..."
                        value={searchQuery}
                        onValueChange={setSearchQuery}
                    />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        {filteredGroups.map((group) => (
                            <CommandGroup
                                key={group.categoryId}
                                heading={group.categoryName}
                            >
                                {group.sizes.map((size) => (
                                    <CommandItem
                                        key={size.id}
                                        value={size.id}
                                        onSelect={() => handleSelect(size.id)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === size.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {size.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};