// src/components/dashboard/hierarchical-category-select.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Type for category with hierarchy info
interface CategoryWithHierarchy {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  level?: number;
  path?: string[];
}

interface HierarchicalCategorySelectProps {
  categories: CategoryWithHierarchy[];
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  allowEmpty?: boolean;
}

/**
 * Build category hierarchy with levels and paths
 * Memoized for performance optimization
 */
function buildCategoryHierarchy(categories: CategoryWithHierarchy[]): CategoryWithHierarchy[] {
  const categoryMap = new Map<string, CategoryWithHierarchy>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));

  const getLevel = (categoryId: string, visited = new Set<string>()): number => {
    if (visited.has(categoryId)) return 1;
    visited.add(categoryId);

    const category = categoryMap.get(categoryId);
    if (!category?.parentId) return 1;
    return 1 + getLevel(category.parentId, visited);
  };

  const getPath = (categoryId: string, visited = new Set<string>()): string[] => {
    if (visited.has(categoryId)) return [];
    visited.add(categoryId);

    const category = categoryMap.get(categoryId);
    if (!category) return [];
    if (!category.parentId) return [category.name];
    return [...getPath(category.parentId, visited), category.name];
  };

  const enhancedCategories = categories.map(category => ({
    ...category,
    level: getLevel(category.id),
    path: getPath(category.id),
  }));

  return enhancedCategories.sort((a, b) => {
    const pathA = a.path?.join('/') || '';
    const pathB = b.path?.join('/') || '';
    return pathA.localeCompare(pathB);
  });
}

const HierarchicalCategorySelect: React.FC<HierarchicalCategorySelectProps> = ({
  categories,
  value,
  onValueChange,
  placeholder = "Select category",
  disabled = false,
  className,
  error = false,
  allowEmpty = true,
}) => {
  const [open, setOpen] = useState(false);

  // Memoize hierarchy building for performance
  const hierarchicalCategories = useMemo(
    () => buildCategoryHierarchy(categories),
    [categories]
  );

  // Find selected category
  const selectedCategory = hierarchicalCategories.find(cat => cat.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            error && "border-red-500",
            className
          )}
        >
          <span className="truncate">
            {selectedCategory ? selectedCategory.name : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search categories..." className="h-9" />
          <CommandEmpty>No categories found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {allowEmpty && (
              <CommandItem
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground italic">None (No Category)</span>
              </CommandItem>
            )}

            {hierarchicalCategories.map((category) => {
              const level = category.level || 1;
              const indentation = (level - 1) * 20; // 20px per level (0 for root)

              return (
                <CommandItem
                  key={category.id}
                  value={`${category.id}-${category.name.toLowerCase()}`}
                  onSelect={() => {
                    onValueChange(category.id === value ? null : category.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 flex-shrink-0",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />

                  <span
                    style={{ marginLeft: `${indentation}px` }}
                    className={cn(
                      "truncate",
                      level === 1 && "font-semibold",
                      level === 2 && "font-medium",
                      level >= 3 && "font-normal"
                    )}
                  >
                    {category.name}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default HierarchicalCategorySelect;