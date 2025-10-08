"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { getArrayParam, removeParams, toggleArrayParam } from "@/lib/utils/query";
import { type FilterOptionsResult, type FilterOption, type SizeGroup } from "@/lib/actions/filters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

type GroupKey = "gender" | "brand" | "category" | "size" | "color" | "price";

interface FiltersProps {
  filterOptions: FilterOptionsResult;
}

export default function Filters({ filterOptions }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = useMemo(() => `?${searchParams.toString()}`, [searchParams]);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<GroupKey, boolean>>({
    gender: true,
    brand: true,
    category: true,
    size: true,
    color: true,
    price: true,
  });

  // Calculate active filter counts
  const activeCounts = {
    gender: getArrayParam(search, "gender").length,
    brand: getArrayParam(search, "brand").length,
    category: getArrayParam(search, "category").length,
    size: getArrayParam(search, "size").length,
    color: getArrayParam(search, "color").length,
    price: getArrayParam(search, "price").length,
  };

  // Total active filters
  const totalActiveFilters = Object.values(activeCounts).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    setMobileOpen(false);
  }, [search]);

  const onToggle = (key: GroupKey, value: string) => {
    const url = toggleArrayParam(pathname, search, key, value);
    router.push(url, { scroll: false });
  };

  const clearAll = () => {
    const url = removeParams(pathname, search, ["gender", "brand", "category", "size", "color", "price", "page"]);
    router.push(url, { scroll: false });
  };

  // Enhanced Filter Group Component
  const FilterGroup = ({
    title,
    children,
    k,
    count = 0,
  }: {
    title: string;
    children: React.ReactNode;
    k: GroupKey;
    count?: number;
  }) => (
    <Collapsible
      open={expanded[k]}
      onOpenChange={(open) => setExpanded((s) => ({ ...s, [k]: open }))}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between py-3 text-sm font-medium hover:text-primary transition-colors">
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {count > 0 && (
            <Badge variant="secondary" className="h-5 px-2 text-xs">
              {count}
            </Badge>
          )}
        </div>
        {expanded[k] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  // Enhanced Filter Options List
  const FilterOptionsList = ({
    options,
    groupKey,
    layout = 'vertical',
    showColors = false
  }: {
    options: FilterOption[];
    groupKey: GroupKey;
    layout?: 'vertical' | 'grid';
    showColors?: boolean;
  }) => {

    const selectedValues = getArrayParam(search, groupKey);

    return (
      <div className={layout === 'grid' ? "grid grid-cols-1 gap-2" : "space-y-2"}>
        {options.map((option) => {
          const checked = selectedValues.includes(option.slug);
          const disabled = option.disabled || option.count === 0;
          const id = `${groupKey}-${option.slug}`;

          return (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => onToggle(groupKey, option.slug)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={id}
                className={`flex-1 text-sm cursor-pointer ${
                  disabled ? 'text-muted-foreground' : ''
                } ${showColors ? 'flex items-center gap-2' : ''}`}
              >
                {showColors && (
                  <div
                    className="w-3 h-3 !min-w-3 !min-h-3 rounded-full border border-border"
                    style={{ 
                      backgroundColor: (option as unknown as { hexCode: string }).hexCode || '#000'
                    }}
                  />
                )}
                <span className="capitalize">{option.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  ({option.count})
                </span>
              </Label>
            </div>
          );
        })}
      </div>
    );
  };

  // Enhanced Size Groups Component
  const SizeGroups = ({ sizeGroups }: { sizeGroups: SizeGroup[] }) => {
    const selectedValues = getArrayParam(search, "size");

    return (
      <div className="space-y-4">
        {sizeGroups.map((group) => (
          <div key={group.categoryId} className="space-y-2">
            {sizeGroups.length > 1 && (
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {group.categoryName}
              </h4>
            )}
            <div className="grid grid-cols-3 gap-2">
              {group.sizes.map((size) => {
                const checked = selectedValues.includes(size.slug);
                const disabled = size.disabled || size.count === 0;
                const id = `size-${size.slug}`;

                return (
                  <div key={size.id} className="flex items-center space-x-1">
                    <Checkbox
                      id={id}
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => onToggle("size", size.slug)}
                      className="h-3 w-3"
                    />
                    <Label
                      htmlFor={id}
                      className={`text-xs cursor-pointer ${
                        disabled ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {size.name}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Enhanced Price Ranges Component
  const PriceRanges = () => {
    const selectedValues = getArrayParam(search, "price");

    return (
      <div className="space-y-2">
        {filterOptions.priceRanges.map((range) => {
          const checked = selectedValues.includes(range.id);
          const disabled = range.count === 0;
          const id = `price-${range.id}`;

          return (
            <div key={range.id} className="flex items-center space-x-2">
              <Checkbox
                id={id}
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => onToggle("price", range.id)}
                className="h-4 w-4"
              />
              <Label
                htmlFor={id}
                className={`flex-1 text-sm cursor-pointer ${
                  disabled ? 'text-muted-foreground' : ''
                }`}
              >
                {range.label}
                <span className="text-xs text-muted-foreground ml-auto">
                  ({range.count})
                </span>
              </Label>
            </div>
          );
        })}
      </div>
    );
  };

  // Desktop Filters Component
  const DesktopFilters = () => (
    <aside className="hidden lg:block">
      <div className="sticky top-20">
        <div className="rounded-lg border bg-card shadow-sm pl-4 pt-4 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Filters</h3>
            {/* {totalActiveFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto p-0 text-xs">
                Clear all
              </Button>
            )} */}
          </div>

          <ScrollArea className="h-[calc(100vh-12rem)] pr-6">
            <div className="space-y-1">
              {filterOptions.genders.length > 0 && (
                <>
                  <FilterGroup
                    title="Gender"
                    k="gender"
                    count={activeCounts.gender}
                  >
                    <FilterOptionsList options={filterOptions.genders} groupKey="gender" />
                  </FilterGroup>
                  <Separator />
                </>
              )}

              {filterOptions.brands.length > 0 && (
                <>
                  <FilterGroup
                    title="Brand"
                    k="brand"
                    count={activeCounts.brand}
                  >
                    <FilterOptionsList options={filterOptions.brands} groupKey="brand" />
                  </FilterGroup>
                  <Separator />
                </>
              )}

              {filterOptions.categories.length > 0 && (
                <>
                  <FilterGroup
                    title="Category"
                    k="category"
                    count={activeCounts.category}
                  >
                    <FilterOptionsList options={filterOptions.categories} groupKey="category" />
                  </FilterGroup>
                  <Separator />
                </>
              )}

              {filterOptions.sizes.length > 0 && (
                <>
                  <FilterGroup
                    title="Size"
                    k="size"
                    count={activeCounts.size}
                  >
                    <SizeGroups sizeGroups={filterOptions.sizes} />
                  </FilterGroup>
                  <Separator />
                </>
              )}

              {filterOptions.colors.length > 0 && (
                <>
                  <FilterGroup
                    title="Color"
                    k="color"
                    count={activeCounts.color}
                  >
                    <FilterOptionsList
                      options={filterOptions.colors}
                      groupKey="color"
                      layout="grid"
                      showColors={true}
                    />
                  </FilterGroup>
                  <Separator />
                </>
              )}

              {filterOptions.priceRanges.length > 0 && (
                <FilterGroup
                  title="Price"
                  k="price"
                  count={activeCounts.price}
                >
                  <PriceRanges />
                </FilterGroup>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </aside>
  );

  // Mobile Filters Component
  const MobileFilters = () => (
    <div className="lg:hidden">
      <div className="flex items-center justify-between mb-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {totalActiveFilters > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {totalActiveFilters}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 sm:w-96">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>Filters</span>
                {/* {totalActiveFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto p-0 text-xs">
                    Clear all
                  </Button>
                )} */}
              </SheetTitle>
            </SheetHeader>
            
            <ScrollArea className="h-[calc(100vh-70px)] p-4 pt-0">
              <div className="space-y-1">
                {filterOptions.genders.length > 0 && (
                  <>
                    <FilterGroup title="Gender" k="gender" count={activeCounts.gender}>
                      <FilterOptionsList options={filterOptions.genders} groupKey="gender" />
                    </FilterGroup>
                    <Separator />
                  </>
                )}

                {filterOptions.brands.length > 0 && (
                  <>
                    <FilterGroup title="Brand" k="brand" count={activeCounts.brand}>
                      <FilterOptionsList options={filterOptions.brands} groupKey="brand" />
                    </FilterGroup>
                    <Separator />
                  </>
                )}

                {filterOptions.categories.length > 0 && (
                  <>
                    <FilterGroup title="Category" k="category" count={activeCounts.category}>
                      <FilterOptionsList options={filterOptions.categories} groupKey="category" />
                    </FilterGroup>
                    <Separator />
                  </>
                )}

                {filterOptions.sizes.length > 0 && (
                  <>
                    <FilterGroup title="Size" k="size" count={activeCounts.size}>
                      <SizeGroups sizeGroups={filterOptions.sizes} />
                    </FilterGroup>
                    <Separator />
                  </>
                )}

                {filterOptions.colors.length > 0 && (
                  <>
                    <FilterGroup title="Color" k="color" count={activeCounts.color}>
                      <FilterOptionsList
                        options={filterOptions.colors}
                        groupKey="color"
                        layout="grid"
                        showColors={true}
                      />
                    </FilterGroup>
                    <Separator />
                  </>
                )}

                {filterOptions.priceRanges.length > 0 && (
                  <FilterGroup title="Price" k="price" count={activeCounts.price}>
                    <PriceRanges />
                  </FilterGroup>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* {totalActiveFilters > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
            Clear all
          </Button>
        )} */}
      </div>
    </div>
  );

  return (
    <>
      <MobileFilters />
      <DesktopFilters />
    </>
  );
}