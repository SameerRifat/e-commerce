"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorsSearchProps {
  placeholder?: string;
  className?: string;
  onSearchChange?: (value: string) => void; // Optional callback for external search handling
}

const ColorsSearch: React.FC<ColorsSearchProps> = ({ 
  placeholder = "Search colors by name, slug, or hex code...",
  className = "",
  onSearchChange = null
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Initialize search term from URL params
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    setSearchTerm(urlSearchTerm);
    setIsSearching(urlSearchTerm.length > 0);
  }, [searchParams]);

  // Handle search submission
  const handleSearch = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (value && value.trim()) {
      params.set('search', value.trim());
      // Reset to page 1 when searching
      params.delete('page');
      setIsSearching(true);
    } else {
      params.delete('search');
      params.delete('page');
      setIsSearching(false);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    
    router.push(url, { scroll: false });
    
    // Call external callback if provided
    if (onSearchChange) {
      onSearchChange(value);
    }
  }, [searchParams, pathname, router, onSearchChange]);

  // Handle input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300); // 300ms debounce (matching your original timing)

    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch]);

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
  };

  return (
    <div className={cn("flex-1 relative", className)}>
      <div className="relative">
        {/* Search Icon */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        
        {/* Search Input */}
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={cn(
            "pl-10 pr-10",
            isSearching && "ring-2 ring-blue-500/20 border-blue-500"
          )}
        />
        
        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorsSearch;