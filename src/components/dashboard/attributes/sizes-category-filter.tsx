// src/components/dashboard/attributes/sizes-category-filter.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type SizeCategoryWithStats } from "@/lib/actions/size-category-management";
import { cn } from "@/lib/utils";

interface SizesCategoryFilterProps {
  categories: SizeCategoryWithStats[];
  currentCategoryId?: string;
  className?: string;
}

const SizesCategoryFilter: React.FC<SizesCategoryFilterProps> = ({
  categories,
  currentCategoryId,
  className = "",
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleCategoryChange = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (categoryId && categoryId !== "all") {
      params.set('categoryId', categoryId);
    } else {
      params.delete('categoryId');
    }
    
    // Reset to page 1 when filtering
    params.delete('page');
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url, { scroll: false });
  };

  const clearFilter = () => {
    handleCategoryChange(null);
  };

  // Find current category info for display
  const currentCategory = currentCategoryId 
    ? categories.find(cat => cat.id === currentCategoryId)
    : null;

  const isUncategorized = currentCategoryId === 'uncategorized';
  const hasActiveFilter = currentCategoryId && currentCategoryId !== 'all';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select
          value={currentCategoryId || "all"}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.sizeCount}
                  </Badge>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="uncategorized">
              <div className="flex items-center justify-between w-full">
                <span>Uncategorized</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filter indicator */}
      {hasActiveFilter && (
        <div className="flex items-center gap-1">
          <Badge variant="default" className="text-xs">
            {isUncategorized ? 'Uncategorized' : currentCategory?.name}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default SizesCategoryFilter;
