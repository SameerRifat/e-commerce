// src/lib/utils/query.ts (Fixed parseFilterParams)
import qs from "query-string";

type QueryValue = string | number | boolean | null | undefined | string[] | number[] | boolean[];
type QueryObject = Record<string, QueryValue>;

export function parseQuery(search: string): QueryObject {
  const parsed = qs.parse(search, { arrayFormat: "bracket" });
  return parsed as QueryObject;
}

export function stringifyQuery(query: QueryObject): string {
  return qs.stringify(query, { skipNull: true, skipEmptyString: true, arrayFormat: "bracket" });
}

export function withUpdatedParams(pathname: string, currentSearch: string, updates: QueryObject): string {
  const current = parseQuery(currentSearch);
  const next: QueryObject = { ...current };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
    } else {
      next[key] = value as QueryValue;
    }
  });

  const search = stringifyQuery(next);
  return search ? `${pathname}?${search}` : pathname;
}

export function toggleArrayParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string
): string {
  const current = parseQuery(currentSearch);
  const arr = new Set<string>(Array.isArray(current[key]) ? (current[key] as string[]) : current[key] ? [String(current[key])] : []);
  if (arr.has(value)) {
    arr.delete(value);
  } else {
    arr.add(value);
  }
  const nextValues = Array.from(arr);
  const updates: QueryObject = { [key]: nextValues.length ? nextValues : undefined };
  return withUpdatedParams(pathname, currentSearch, updates);
}

export function setParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string | number | null | undefined
): string {
  return withUpdatedParams(pathname, currentSearch, { [key]: value === null || value === undefined ? undefined : String(value) });
}

export function removeParams(pathname: string, currentSearch: string, keys: string[]): string {
  const current = parseQuery(currentSearch);
  keys.forEach((k) => delete current[k]);
  const search = stringifyQuery(current);
  return search ? `${pathname}?${search}` : pathname;
}

export function getArrayParam(search: string, key: string): string[] {
  const q = parseQuery(search);
  const v = q[key];
  if (Array.isArray(v)) return v.map(String);
  if (v === undefined) return [];
  return [String(v)];
}

export function getStringParam(search: string, key: string): string | undefined {
  const q = parseQuery(search);
  const v = q[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? (v[0] ? String(v[0]) : undefined) : String(v);
}

export type NormalizedProductFilters = {
  search?: string;
  genderSlugs?: string[];
  sizeSlugs?: string[];
  colorSlugs?: string[];
  brandSlugs?: string[];
  categorySlugs?: string[];
  priceMin?: number;
  priceMax?: number;
  priceRanges?: Array<[number | undefined, number | undefined]>;
  sort?: "featured" | "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
};

// ===== FIXED: Handle both Next.js native params and bracket notation =====
export function parseFilterParams(sp: Record<string, string | string[] | undefined>): NormalizedProductFilters {
  // Helper to get array values - handles both 'key' and 'key[]' formats
  const getArr = (k: string): string[] => {
    // Try direct key first (Next.js native format)
    const direct = sp[k];
    if (direct !== undefined) {
      return Array.isArray(direct) ? direct.map(String) : [String(direct)];
    }
    
    // Try bracket notation (query-string format)
    const bracket = sp[`${k}[]`];
    if (bracket !== undefined) {
      return Array.isArray(bracket) ? bracket.map(String) : [String(bracket)];
    }
    
    return [];
  };

  // Helper to get string values
  const getStr = (k: string): string | undefined => {
    const direct = sp[k];
    if (direct !== undefined) {
      return Array.isArray(direct) ? (direct[0] ? String(direct[0]) : undefined) : String(direct);
    }
    
    const bracket = sp[`${k}[]`];
    if (bracket !== undefined) {
      return Array.isArray(bracket) ? (bracket[0] ? String(bracket[0]) : undefined) : String(bracket);
    }
    
    return undefined;
  };

  const search = getStr("search")?.trim() || undefined;

  // Get filter arrays and normalize to lowercase
  const genderSlugs = getArr("gender").map((s) => s.toLowerCase()).filter(Boolean);
  const sizeSlugs = getArr("size").map((s) => s.toLowerCase()).filter(Boolean);
  const colorSlugs = getArr("color").map((s) => s.toLowerCase()).filter(Boolean);
  const brandSlugs = getArr("brand").map((s) => s.toLowerCase()).filter(Boolean);
  const categorySlugs = getArr("category").map((s) => s.toLowerCase()).filter(Boolean);

  // Parse price ranges
  const priceRangesStr = getArr("price");
  const priceRanges: Array<[number | undefined, number | undefined]> = priceRangesStr
    .map((r) => {
      const [minStr, maxStr] = String(r).split("-");
      const min = minStr ? Number(minStr) : undefined;
      const max = maxStr ? Number(maxStr) : undefined;
      return [Number.isNaN(min as number) ? undefined : min, Number.isNaN(max as number) ? undefined : max] as [
        number | undefined,
        number | undefined
      ];
    })
    .filter(([min, max]) => min !== undefined || max !== undefined);

  const priceMin = getStr("priceMin") ? Number(getStr("priceMin")) : undefined;
  const priceMax = getStr("priceMax") ? Number(getStr("priceMax")) : undefined;

  const sortParam = getStr("sort");
  const sort: NormalizedProductFilters["sort"] =
    sortParam === "price_asc" || sortParam === "price_desc" || sortParam === "newest" || sortParam === "featured"
      ? sortParam
      : "newest";

  const page = Math.max(1, Number(getStr("page") ?? 1) || 1);
  const limitRaw = Number(getStr("limit") ?? 24) || 24;
  const limit = Math.max(1, Math.min(limitRaw, 60));

  return {
    search,
    genderSlugs: genderSlugs.length ? genderSlugs : undefined,
    sizeSlugs: sizeSlugs.length ? sizeSlugs : undefined,
    colorSlugs: colorSlugs.length ? colorSlugs : undefined,
    brandSlugs: brandSlugs.length ? brandSlugs : undefined,
    categorySlugs: categorySlugs.length ? categorySlugs : undefined,
    priceMin: priceMin !== undefined && !Number.isNaN(priceMin) ? priceMin : undefined,
    priceMax: priceMax !== undefined && !Number.isNaN(priceMax) ? priceMax : undefined,
    priceRanges: priceRanges.length ? priceRanges : undefined,
    sort,
    page,
    limit,
  };
}

export function buildProductQueryObject(filters: NormalizedProductFilters) {
  return filters;
}

export function buildFilterBadges(searchParams: Record<string, string | string[] | undefined>): string[] {
  const activeBadges: string[] = [];
  
  // Helper to get arrays from params
  const getArr = (k: string): string[] => {
    const direct = searchParams[k];
    const bracket = searchParams[`${k}[]`];
    
    if (direct !== undefined) {
      return Array.isArray(direct) ? direct : [String(direct)];
    }
    if (bracket !== undefined) {
      return Array.isArray(bracket) ? bracket : [String(bracket)];
    }
    return [];
  };
  
  // Gender badges
  const genders = getArr("gender");
  genders.forEach((g) => activeBadges.push(String(g)[0].toUpperCase() + String(g).slice(1)));
  
  // Brand badges
  const brands = getArr("brand");
  brands.forEach((b) => activeBadges.push(String(b)[0].toUpperCase() + String(b).slice(1)));
  
  // Category badges
  const categories = getArr("category");
  categories.forEach((c) => activeBadges.push(String(c)[0].toUpperCase() + String(c).slice(1)));
  
  // Size badges
  const sizes = getArr("size");
  sizes.forEach((s) => activeBadges.push(`Size: ${s}`));
  
  // Color badges
  const colors = getArr("color");
  colors.forEach((c) => activeBadges.push(String(c)[0].toUpperCase() + String(c).slice(1)));
  
  // Price badges
  const prices = getArr("price");
  prices.forEach((p) => {
    const [min, max] = String(p).split("-");
    const label = min && max ? `$${min} - $${max}` : min && !max ? `Over $${min}` : `$0 - $${max}`;
    activeBadges.push(label);
  });
  
  return activeBadges;
}