// src/components/dashboard/users/users-filters.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";

interface UsersFiltersProps {
  currentFilters: {
    role: string;
    emailVerified: string;
    sortBy: string;
    sortOrder: string;
  };
}

const UsersFilters: React.FC<UsersFiltersProps> = ({ currentFilters }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Reset to page 1 when filtering
    params.delete('page');
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    // Remove all filter params but keep search if it exists
    const search = params.get('search');
    params.delete('role');
    params.delete('emailVerified');
    params.delete('sortBy');
    params.delete('sortOrder');
    params.delete('page');
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url, { scroll: false });
  };

  // Check if any filters are active (excluding defaults)
  const hasActiveFilters = 
    currentFilters.role !== "all" ||
    currentFilters.emailVerified !== "all" ||
    currentFilters.sortBy !== "createdAt" ||
    currentFilters.sortOrder !== "desc";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Role Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500" />
        <Select
          value={currentFilters.role}
          onValueChange={(value) => updateFilter("role", value)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Email Verification Filter */}
      <Select
        value={currentFilters.emailVerified}
        onValueChange={(value) => updateFilter("emailVerified", value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Users" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="unverified">Unverified</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort By Filter */}
      <Select
        value={currentFilters.sortBy}
        onValueChange={(value) => updateFilter("sortBy", value)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Created Date</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="email">Email</SelectItem>
          <SelectItem value="role">Role</SelectItem>
          <SelectItem value="orderCount">Order Count</SelectItem>
          <SelectItem value="totalSpent">Total Spent</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Order Filter */}
      <Select
        value={currentFilters.sortOrder}
        onValueChange={(value) => updateFilter("sortOrder", value)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asc">Ascending</SelectItem>
          <SelectItem value="desc">Descending</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
};

export default UsersFilters;