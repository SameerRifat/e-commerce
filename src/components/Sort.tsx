// src/components/Sort.tsx (ENHANCED)
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { setParam } from "@/lib/utils/query";
import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Define sort options with proper typing
const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price (Low → High)", value: "price_asc" },
  { label: "Price (High → Low)", value: "price_desc" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// Helper to validate sort value
function isValidSortValue(value: string | null): value is SortValue {
  return SORT_OPTIONS.some((opt) => opt.value === value);
}

export default function Sort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);
  
  const sortParam = searchParams.get("sort");
  const selected = isValidSortValue(sortParam) ? sortParam : "newest";

  const onChange = (value: string) => {
    // Validate the value
    if (!isValidSortValue(value)) {
      console.error(`Invalid sort value: ${value}`);
      return;
    }

    // Set sort parameter
    const withSort = setParam(pathname, search, "sort", value);
    
    // Reset to page 1 when changing sort
    const withPageReset = setParam(
      pathname,
      new URL(withSort, "http://dummy").search,
      "page",
      "1"
    );
    
    router.push(withPageReset, { scroll: false });
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Label htmlFor="sort-select" className="text-sm font-normal text-foreground shrink-0">
        Sort by
      </Label>
      <Select value={selected} onValueChange={onChange}>
        <SelectTrigger id="sort-select" className="w-[160px] sm:w-[200px] text-xs sm:text-sm px-2 py-0 sm:px-3 sm:py-2 !h-8 sm:!h-9">
          <SelectValue placeholder="Select sort order" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}