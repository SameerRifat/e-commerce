// src/lib/db/mock-data.ts
// Mock data demonstrating different product types

export const mockColors = [
  { id: "1", name: "Ruby Red", hexCode: "#DC143C" },
  { id: "2", name: "Coral Pink", hexCode: "#FF7F7F" },
  { id: "3", name: "Nude Beige", hexCode: "#F5DEB3" },
  { id: "4", name: "Clear", hexCode: "#FFFFFF" },
  { id: "5", name: "Deep Purple", hexCode: "#9932CC" },
  { id: "6", name: "Golden Yellow", hexCode: "#FFD700" },
];

export const mockSizes = [
  { id: "1", name: "Standard" },
  { id: "2", name: "Mini" },
  { id: "3", name: "30ml" },
  { id: "4", name: "50ml" },
  { id: "5", name: "100ml" },
  { id: "6", name: "Travel Size" },
];

export const mockBrands = [
  { id: "1", name: "Glamour Beauty" },
  { id: "2", name: "Pure Skin" },
  { id: "3", name: "Color Pop" },
  { id: "4", name: "Luxury Scents" },
];

export const mockCategories = [
  { id: "1", name: "Lipstick" },
  { id: "2", name: "Foundation" },
  { id: "3", name: "Serum" },
  { id: "4", name: "Perfume" },
  { id: "5", name: "Skincare" },
];

export const mockGenders = [
  { id: "1", label: "Women" },
  { id: "2", label: "Men" },
  { id: "3", label: "Unisex" },
];

// Example products demonstrating different scenarios:

// 1. Simple Product - No variants, just basic pricing and stock
export const simpleProductExample = {
  name: "Daily Moisturizer",
  description: "A gentle, hydrating moisturizer suitable for all skin types.",
  productType: "simple",
  categoryId: "5", // Skincare
  brandId: "2", // Pure Skin
  genderId: "3", // Unisex
  sku: "MOIST-DAILY-001",
  price: "29.99",
  salePrice: null,
  inStock: 150,
  weight: 200, // 200g
  isPublished: true,
};

// 2. Color-Only Product - Lipstick with different shades but same pricing
export const colorOnlyProductExample = {
  name: "Matte Lipstick Collection",
  description: "Long-lasting matte lipstick available in multiple stunning shades.",
  productType: "configurable",
  categoryId: "1", // Lipstick
  brandId: "1", // Glamour Beauty
  genderId: "1", // Women
  isPublished: true,
  variants: [
    {
      sku: "LIP-MATTE-RED",
      price: "24.99",
      salePrice: null,
      colorId: "1", // Ruby Red
      sizeId: null, // No size variation
      inStock: 50,
      weight: 15,
    },
    {
      sku: "LIP-MATTE-PINK",
      price: "24.99",
      salePrice: null,
      colorId: "2", // Coral Pink
      sizeId: null,
      inStock: 35,
      weight: 15,
    },
    {
      sku: "LIP-MATTE-NUDE",
      price: "24.99",
      salePrice: null,
      colorId: "3", // Nude Beige
      sizeId: null,
      inStock: 42,
      weight: 15,
    },
  ],
};

// 3. Size-Only Product - Perfume with different sizes but same scent
export const sizeOnlyProductExample = {
  name: "Elegant Rose Perfume",
  description: "A sophisticated rose fragrance available in multiple sizes.",
  productType: "configurable",
  categoryId: "4", // Perfume
  brandId: "4", // Luxury Scents
  genderId: "1", // Women
  isPublished: true,
  variants: [
    {
      sku: "PERF-ROSE-30ML",
      price: "45.00",
      salePrice: null,
      colorId: null, // No color variation
      sizeId: "3", // 30ml
      inStock: 25,
      weight: 80,
    },
    {
      sku: "PERF-ROSE-50ML",
      price: "65.00",
      salePrice: null,
      colorId: null,
      sizeId: "4", // 50ml
      inStock: 15,
      weight: 120,
    },
    {
      sku: "PERF-ROSE-100ML",
      price: "95.00",
      salePrice: null,
      colorId: null,
      sizeId: "5", // 100ml
      inStock: 8,
      weight: 200,
    },
  ],
};

// 4. Full Variation Product - Foundation with both color and size options
export const fullVariationProductExample = {
  name: "Perfect Match Foundation",
  description: "Full coverage foundation available in multiple shades and sizes.",
  productType: "configurable",
  categoryId: "2", // Foundation
  brandId: "2", // Pure Skin
  genderId: "3", // Unisex
  isPublished: true,
  variants: [
    {
      sku: "FOUND-BEIGE-30ML",
      price: "32.00",
      salePrice: "28.80",
      colorId: "3", // Nude Beige
      sizeId: "3", // 30ml
      inStock: 20,
      weight: 45,
    },
    {
      sku: "FOUND-BEIGE-50ML",
      price: "45.00",
      salePrice: null,
      colorId: "3", // Nude Beige
      sizeId: "4", // 50ml
      inStock: 15,
      weight: 65,
    },
    // Add more combinations as needed
  ],
};

export const productExamples = {
  simple: simpleProductExample,
  colorOnly: colorOnlyProductExample,
  sizeOnly: sizeOnlyProductExample,
  fullVariation: fullVariationProductExample,
};
