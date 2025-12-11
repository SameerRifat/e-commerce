'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { FullProduct } from '@/lib/actions/product';

/**
 * Industry-Standard Variant Selection Pattern (Shopify, Amazon approach)
 *
 * - Variant selection state maintained in URL parameters (shareable, SEO-friendly)
 * - Selecting a variant is a navigation event, not state mutation
 * - Simple implementation without Context API or Zustand
 * - Progressive enhancement compatible
 * - DISABLED incompatible options (not auto-switch like before)
 *
 * Pattern: Disable incompatible combinations (Amazon/Shopify)
 * - User selects Red → sizes incompatible with Red are DISABLED
 * - Clear, predictable UX
 * - No surprising auto-changes
 *
 * Industry References:
 * - https://shopify.dev/docs/api/hydrogen/latest/components/variantselector
 * - Amazon product pages: Disable incompatible sizes when color selected
 */

type Variant = FullProduct['variants'][number];

interface VariantSelectorProps {
  variants: Variant[];
  productSlug: string;
}

export function VariantSelector({ variants, productSlug }: VariantSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current selections from URL
  const selectedColorSlug = searchParams.get('color');
  const selectedSizeSlug = searchParams.get('size');

  // Extract unique colors and sizes from variants
  const availableColors = Array.from(
    new Map(
      variants
        .filter(v => v.color)
        .map(v => [v.color!.id, v.color!])
    ).values()
  );

  const availableSizes = Array.from(
    new Map(
      variants
        .filter(v => v.size)
        .map(v => [v.size!.id, v.size!])
    ).values()
  ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  // Find selected variant based on URL params
  const selectedVariant = variants.find(v => {
    const colorMatch = selectedColorSlug
      ? v.color?.slug === selectedColorSlug
      : !v.color;
    const sizeMatch = selectedSizeSlug
      ? v.size?.slug === selectedSizeSlug
      : !v.size;
    return colorMatch && sizeMatch;
  }) || variants[0];

  // Check if a color is available (has at least one variant with stock)
  const isColorAvailable = (colorSlug: string) => {
    return variants.some(v => v.color?.slug === colorSlug && v.inStock > 0);
  };

  // Check if a size is available given the current color selection
  const isSizeAvailable = (sizeSlug: string) => {
    if (!selectedColorSlug) {
      // No color selected - size is available if any variant with this size has stock
      return variants.some(v => v.size?.slug === sizeSlug && v.inStock > 0);
    }
    // Color selected - size is available if compatible variant exists with stock
    return variants.some(
      v => v.color?.slug === selectedColorSlug && v.size?.slug === sizeSlug && v.inStock > 0
    );
  };

  // Navigation handlers (simpler - no auto-compatibility)
  const handleColorSelect = (colorSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('color', colorSlug);
    router.push(`/products/${productSlug}?${params.toString()}`, { scroll: false });
  };

  const handleSizeSelect = (sizeSlug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('size', sizeSlug);
    router.push(`/products/${productSlug}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      {availableColors.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-medium">
            Color: {selectedVariant?.color?.name || 'Select'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {availableColors.map((color) => {
              const isSelected = selectedVariant?.color?.id === color.id;
              const isAvailable = isColorAvailable(color.slug);

              return (
                <Button
                  key={color.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => isAvailable && handleColorSelect(color.slug)}
                  disabled={!isAvailable}
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 p-0 ${
                    isSelected
                      ? 'border-gray-800 shadow-md'
                      : isAvailable
                      ? 'border-gray-300 hover:border-gray-400'
                      : 'border-gray-200 opacity-50 cursor-not-allowed'
                  }`}
                  title={`${color.name}${!isAvailable ? ' (Out of stock)' : ''}`}
                  aria-label={`Select color ${color.name}${!isAvailable ? ' (Out of stock)' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <Check className="!w-3 !h-3 text-white" />
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gray-400 rotate-45" />
                    </div>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm sm:text-base font-medium">
            Size: {selectedVariant?.size?.name || 'Select'}
          </h3>
          <div className="grid grid-cols-4 2xl:grid-cols-5 gap-3">
            {availableSizes.map((size) => {
              const isSelected = selectedVariant?.size?.id === size.id;
              const isAvailable = isSizeAvailable(size.slug);

              return (
                <Button
                  key={size.id}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => isAvailable && handleSizeSelect(size.slug)}
                  disabled={!isAvailable}
                  className={`text-sm sm:font-medium h-8 sm:h-9 ${
                    !isAvailable ? 'opacity-50 cursor-not-allowed line-through' : ''
                  }`}
                  aria-label={`Select size ${size.name}${!isAvailable ? ' (Not available)' : ''}`}
                  title={!isAvailable ? 'Not available' : undefined}
                >
                  {size.name}
                </Button>
              );
            })}
          </div>
          {!selectedVariant && selectedColorSlug && selectedSizeSlug && (
            <p className="text-sm text-red-600">
              This combination is not available. Please select a different option.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Hook to get selected variant from URL params
 * Follows Shopify Hydrogen pattern of URL-based state
 */
export function useSelectedVariant(variants: Variant[]) {
  const searchParams = useSearchParams();
  const selectedColorSlug = searchParams.get('color');
  const selectedSizeSlug = searchParams.get('size');

  const selectedVariant = variants.find(v => {
    const colorMatch = selectedColorSlug
      ? v.color?.slug === selectedColorSlug
      : !v.color;
    const sizeMatch = selectedSizeSlug
      ? v.size?.slug === selectedSizeSlug
      : !v.size;
    return colorMatch && sizeMatch;
  });

  return selectedVariant || variants[0];
}
