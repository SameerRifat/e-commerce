// src/components/header/search-input.tsx
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PersistentSearchProps {
  className?: string;
}

const RECENT_SEARCHES_KEY = "recent_searches";
const MAX_RECENT_SEARCHES = 5;

// Local storage helpers
const getRecentSearches = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter((q) => q.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const clearRecentSearches = () => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently fail
  }
};

export function PersistentSearch({ className = "" }: PersistentSearchProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Update input when URL search param changes
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      // Save to recent searches
      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());

      // Navigate to products page with search query
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(searchQuery);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setShowSuggestions(false);

    // If we're on products page with search, navigate to products without search
    if (searchParams.get("search")) {
      router.push("/products");
    }

    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (recentSearches.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Delay to allow click events on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 bg-muted rounded-full pl-3 pr-1.5 py-1.5 transition-all duration-200 ${isFocused ? "ring-2 ring-primary ring-offset-1" : "ring-1 ring-transparent ring-offset-1"
          }`}
      >
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search for products..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground min-w-0"
          autoComplete="off"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 w-6 p-0 hover:bg-accent rounded-full flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={() => handleSearch(searchQuery)}
          disabled={!searchQuery.trim()}
          className="h-8 w-8 p-0 rounded-full flex-shrink-0 disabled:opacity-50"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Recent Searches Dropdown */}
      {showSuggestions && recentSearches.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Recent Searches</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearRecent}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          </div>
          <div className="py-1">
            {recentSearches.map((query, index) => (
              <button
                key={`${query}-${index}`}
                onClick={() => handleRecentSearchClick(query)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-3"
              >
                <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent searches when overlay opens
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      // Reset to current search param when opening
      setSearchQuery(searchParams.get("search") || "");
    }
  }, [isOpen, searchParams]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      // Save to recent searches
      saveRecentSearch(trimmed);

      // Navigate to products page with search query
      router.push(`/products?search=${encodeURIComponent(trimmed)}`);
      onClose();
      setSearchQuery("");
    }
  }, [router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(searchQuery);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Search Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-lg animate-in slide-in-from-top duration-300 max-h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border sticky top-0 bg-background">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 -ml-1"
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-3 bg-muted rounded-full px-4 h-11 border border-border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 transition-all">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for products..."
                className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleClear}
                className={`h-7 w-7 p-0 hover:bg-accent rounded-full flex-shrink-0 flex items-center justify-center transition-opacity ${searchQuery ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
                aria-label="Clear search"
                tabIndex={searchQuery ? 0 : -1}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Content */}
        <div className="px-4 py-4">
          {searchQuery ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                Press Enter to search for
              </p>
              <p className="text-lg font-medium">&quot;{searchQuery}&quot;</p>
              <Button
                onClick={() => handleSearch(searchQuery)}
                className="mt-4"
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          ) : recentSearches.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Recent Searches</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRecent}
                  className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear All
                </Button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((query, index) => (
                  <button
                    key={`${query}-${index}`}
                    onClick={() => handleRecentSearchClick(query)}
                    className="w-full px-3 py-2.5 text-left rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                  >
                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">{query}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Start typing to search products
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}