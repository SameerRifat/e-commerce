"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { getArrayParam, toggleArrayParam, removeParams } from "@/lib/utils/query";

type FilterBadge = {
  label: string;
  filterKey: "gender" | "brand" | "category" | "size" | "color" | "price";
  value: string;
};

export default function FilterBadges() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  // Build active filter badges
  const activeBadges = useMemo(() => {
    const badges: FilterBadge[] = [];

    // Gender badges
    const genders = getArrayParam(search, "gender");
    genders.forEach((g) => {
      badges.push({
        label: g.charAt(0).toUpperCase() + g.slice(1),
        filterKey: "gender",
        value: g,
      });
    });

    // Brand badges
    const brands = getArrayParam(search, "brand");
    brands.forEach((b) => {
      badges.push({
        label: b.charAt(0).toUpperCase() + b.slice(1),
        filterKey: "brand",
        value: b,
      });
    });

    // Category badges
    const categories = getArrayParam(search, "category");
    categories.forEach((c) => {
      badges.push({
        label: c.charAt(0).toUpperCase() + c.slice(1),
        filterKey: "category",
        value: c,
      });
    });

    // Size badges
    const sizes = getArrayParam(search, "size");
    sizes.forEach((s) => {
      badges.push({
        label: `Size: ${s}`,
        filterKey: "size",
        value: s,
      });
    });

    // Color badges
    const colors = getArrayParam(search, "color");
    colors.forEach((c) => {
      badges.push({
        label: c.charAt(0).toUpperCase() + c.slice(1),
        filterKey: "color",
        value: c,
      });
    });

    // Price badges
    const prices = getArrayParam(search, "price");
    prices.forEach((p) => {
      const [min, max] = p.split("-");
      const label = min && max ? `$${min} - $${max}` : min && !max ? `Over $${min}` : `$0 - $${max}`;
      badges.push({
        label,
        filterKey: "price",
        value: p,
      });
    });

    return badges;
  }, [search]);

  const handleRemoveBadge = (badge: FilterBadge) => {
    const url = toggleArrayParam(pathname, search, badge.filterKey, badge.value);
    router.push(url, { scroll: false });
  };

  const handleClearAll = () => {
    const url = removeParams(pathname, search, [
      "gender",
      "brand",
      "category",
      "size",
      "color",
      "price",
      "page",
    ]);
    router.push(url, { scroll: false });
  };

  if (activeBadges.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {activeBadges.map((badge, i) => (
        <Badge
          key={`${badge.filterKey}-${badge.value}-${i}`}
          variant="secondary"
          className="gap-1 pr-1 text-sm"
        >
          {badge.label}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => handleRemoveBadge(badge)}
            aria-label={`Remove ${badge.label} filter`}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {activeBadges.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-7 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}