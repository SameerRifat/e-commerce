// src/types/dashboard.ts
// Comprehensive TypeScript type definitions for dashboard components

import type { ReactNode } from "react";

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Brand types
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}

export interface BrandListItem {
  name: string;
  slug: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export interface CategoryListItem {
  name: string;
  slug: string;
}

// Gender types
export interface Gender {
  id: string;
  label: string;
  slug: string;
}

export interface GenderListItem {
  label: string;
  slug: string;
}

// Color types
export interface Color {
  id: string;
  name: string;
  slug: string;
  hexCode: string;
}

// Size types
export interface Size {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

// Product image types
export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder?: number;
  variantId?: string | null;
}

// Product variant types
export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
  salePrice?: string | null;
  inStock: number;
  weight?: number | null;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
  color?: Color | null;
  size?: Size | null;
}

export interface ProductVariantListItem {
  id: string;
  price: string;
  salePrice?: string | null;
  inStock: number;
  color: { name: string; hexCode: string } | null;
  size: { name: string } | null;
}

// Product types
export type ProductType = "simple" | "configurable";

export interface Product extends BaseEntity {
  name: string;
  description: string;
  productType: ProductType;
  isPublished: boolean;
  brand?: Brand | null;
  category?: Category | null;
  gender?: Gender | null;
  // Simple product fields
  price?: string | null;
  salePrice?: string | null;
  sku?: string | null;
  inStock?: number | null;
  weight?: number | null;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  } | null;
}

export interface DashboardProduct extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface DashboardProductListItem extends Product {
  brand: BrandListItem | null;
  category: CategoryListItem | null;
  gender: GenderListItem | null;
  variants: ProductVariantListItem[];
  images: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
}

// Filter types
export interface DashboardProductFilters {
  search?: string;
  status?: "all" | "published" | "draft";
  category?: string;
  brand?: string;
  productType?: "all" | "simple" | "configurable";
  page?: number;
  limit?: number;
  sort?: "name_asc" | "name_desc" | "created_asc" | "created_desc" | "updated_asc" | "updated_desc";
}

// API response types
export interface DashboardProductsResponse {
  products: DashboardProductListItem[];
  totalCount: number;
  stats: {
    total: number;
    published: number;
    drafts: number;
    simple: number;
    configurable: number;
  };
}

export interface DashboardFilterOptions {
  brands: BrandListItem[];
  categories: CategoryListItem[];
}

// Component props types
export interface PageHeaderAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: ReactNode;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: PageHeaderAction;
  children?: ReactNode;
  className?: string;
}

export interface DashboardFiltersProps {
  brands: BrandListItem[];
  categories: CategoryListItem[];
  currentFilters: {
    search?: string;
    status?: string;
    category?: string;
    brand?: string;
    productType?: string;
    sort?: string;
  };
}

export interface DashboardPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  className?: string;
}

// Data table types
export interface DataTableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (value: any, item: T) => ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onView?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// Form types
export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Utility types for server components
export type ServerComponentProps<T = {}> = T & {
  searchParams: SearchParams;
};

export type PageProps = ServerComponentProps & {
  params: { [key: string]: string };
};

// Error handling types
export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
}

// Stats types
export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  simple: number;
  configurable: number;
}

// Sort options
export type SortOption = {
  value: string;
  label: string;
};

export const SORT_OPTIONS: SortOption[] = [
  { value: "updated_desc", label: "Recently Updated" },
  { value: "updated_asc", label: "Oldest Updated" },
  { value: "created_desc", label: "Newest" },
  { value: "created_asc", label: "Oldest" },
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
];

// Status options
export type StatusOption = {
  value: string;
  label: string;
};

export const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

// Product type options
export type ProductTypeOption = {
  value: string;
  label: string;
};

export const PRODUCT_TYPE_OPTIONS: ProductTypeOption[] = [
  { value: "all", label: "All Types" },
  { value: "simple", label: "Simple" },
  { value: "configurable", label: "Configurable" },
];

// Pagination constants
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;
