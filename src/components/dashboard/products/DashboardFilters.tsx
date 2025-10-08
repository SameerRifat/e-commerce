"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { withUpdatedParams } from "@/lib/utils/query";
import type { DashboardFiltersProps } from "@/types/dashboard";

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  brands,
  categories,
  currentFilters,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  const updateFilter = (key: string, value: string | null) => {
    const updates = { [key]: value === "all" || !value ? undefined : value, page: undefined };
    const newUrl = withUpdatedParams(pathname, currentSearch, updates);
    router.push(newUrl, { scroll: false });
  };

  const updateSearch = (search: string) => {
    const updates = { search: search.trim() || undefined, page: undefined };
    const newUrl = withUpdatedParams(pathname, currentSearch, updates);
    router.push(newUrl, { scroll: false });
  };

  const clearAllFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchValue = formData.get("search") as string;
    updateSearch(searchValue);
  };

  const hasActiveFilters = Object.values(currentFilters).some(
    (value) => value && value !== "all"
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          name="search"
          placeholder="Search products..."
          defaultValue={currentFilters.search || ""}
          className="pl-10"
        />
      </form>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Filter */}
        <Select
          value={currentFilters.status || "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {/* Product Type Filter */}
        <Select
          value={currentFilters.productType || "all"}
          onValueChange={(value) => updateFilter("productType", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="simple">Simple</SelectItem>
            <SelectItem value="configurable">Configurable</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={currentFilters.category || "all"}
          onValueChange={(value) => updateFilter("category", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Brand Filter */}
        <Select
          value={currentFilters.brand || "all"}
          onValueChange={(value) => updateFilter("brand", value)}
        >
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand.slug} value={brand.slug}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={currentFilters.sort || "updated_desc"}
          onValueChange={(value) => updateFilter("sort", value)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Recently Updated</SelectItem>
            <SelectItem value="updated_asc">Oldest Updated</SelectItem>
            <SelectItem value="created_desc">Newest</SelectItem>
            <SelectItem value="created_asc">Oldest</SelectItem>
            <SelectItem value="name_asc">Name A-Z</SelectItem>
            <SelectItem value="name_desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;
