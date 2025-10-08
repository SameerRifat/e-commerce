// src/components/dashboard/products/index.ts

// Main form component
export { default as UnifiedProductForm } from './unified-product-form';

// Step components
export { default as ProductBasicInfoStep } from './steps/ProductBasicInfoStep';
export { default as ProductVariantsStep } from './steps/ProductVariantsStep';
export { default as ProductImagesStep } from './steps/ProductImagesStep';
export { default as ProductInventoryStep } from './steps/ProductInventoryStep';

// Shared components
export { default as VariantCard } from './components/VariantCard';
export { default as StepNavigation } from './components/StepNavigation';

// Dashboard-specific components
export { default as DashboardFilters } from './DashboardFilters';
export { default as DashboardPagination } from './DashboardPagination';
export { default as ProductsTableWrapper } from './ProductsTableWrapper';