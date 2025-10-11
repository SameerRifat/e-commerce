// src/components/dashboard/attributes/colors-search.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorsSearchProps {
  placeholder?: string;
  className?: string;
  onSearchChange?: (value: string) => void;
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
  
  // Track if this is the initial mount
  const isInitialMount = useRef(true);
  // Track the last URL search param to avoid unnecessary updates
  const lastUrlSearch = useRef<string>('');

  // Initialize search term from URL params only once on mount
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    lastUrlSearch.current = urlSearchTerm;
    setSearchTerm(urlSearchTerm);
    setIsSearching(urlSearchTerm.length > 0);
    isInitialMount.current = false;
  }, []); // Empty dependency array - only run on mount

  // Handle search submission
  const handleSearch = useCallback((value: string) => {
    const trimmedValue = value.trim();
    
    // Don't update if the search value hasn't actually changed
    if (trimmedValue === lastUrlSearch.current) {
      return;
    }
    
    const params = new URLSearchParams(searchParams);
    
    if (trimmedValue) {
      params.set('search', trimmedValue);
      // Reset to page 1 when searching
      params.delete('page');
      setIsSearching(true);
    } else {
      params.delete('search');
      params.delete('page');
      setIsSearching(false);
    }
    
    // Update the last URL search value
    lastUrlSearch.current = trimmedValue;
    
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
    // Skip the debounced search on initial mount
    if (isInitialMount.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]); // Only depend on searchTerm, not handleSearch

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
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ColorsSearch;