// src/components/VariantSelector.tsx
"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useVariantStore } from '@/store/variant';

import type { FullProduct } from '@/lib/actions/product';

type Variant = FullProduct['variants'][number];
type Color = NonNullable<Variant['color']>;
type Size = NonNullable<Variant['size']>;

// Types for variant selection
export interface VariantSelectionContext {
  selectedColorId: string | null;
  selectedSizeId: string | null;
  selectedVariant: Variant | null;
  availableColors: Color[];
  availableSizes: Size[];
  setSelectedColor: (colorId: string | null) => void;
  setSelectedSize: (sizeId: string | null) => void;
  getGalleryVariantIndex: () => number;
}

const VariantContext = createContext<VariantSelectionContext | null>(null);

export const useVariantSelection = () => {
  const context = useContext(VariantContext);
  if (!context) {
    throw new Error('useVariantSelection must be used within a VariantSelectionProvider');
  }
  return context;
};

interface VariantSelectionProviderProps {
  productId: string;
  variants: Variant[];
  galleryVariants: Array<{ color: string; images: string[] }>;
  children: React.ReactNode;
  defaultColorId?: string | null;
  defaultSizeId?: string | null;
}

export const VariantSelectionProvider: React.FC<VariantSelectionProviderProps> = ({
  productId,
  variants,
  galleryVariants,
  children,
  defaultColorId = null,
  defaultSizeId = null,
}) => {
  const { setSelected } = useVariantStore();
  const lastGalleryIndexRef = useRef<number>(-1);
  
  // Get unique colors and sizes - memoized to prevent infinite loops
  const availableColors = useMemo(() => {
    return variants.reduce((acc: Color[], variant) => {
      if (variant.color && !acc.some(c => c.id === variant.color!.id)) {
        acc.push(variant.color);
      }
      return acc;
    }, []);
  }, [variants]);

  const availableSizes = useMemo(() => {
    return variants.reduce((acc: Size[], variant) => {
      if (variant.size && !acc.some(s => s.id === variant.size!.id)) {
        acc.push(variant.size);
      }
      return acc;
    }, []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [variants]);

  // Initialize with first available variant or defaults
  const firstVariant = variants[0];
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    defaultColorId || firstVariant?.color?.id || null
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(
    defaultSizeId || firstVariant?.size?.id || null
  );

  // Find the currently selected variant - memoized to prevent recalculations
  const selectedVariant = useMemo(() => {
    return variants.find(v => {
      // Handle partial attribute combinations properly
      const hasColor = !!v.color;
      const hasSize = !!v.size;
      const hasSelectedColor = !!selectedColorId;
      const hasSelectedSize = !!selectedSizeId;
      
      // If variant has no color and no size, it matches any selection
      if (!hasColor && !hasSize) {
        return true;
      }
      
      // If variant has color but no size, match only on color
      if (hasColor && !hasSize) {
        return hasSelectedColor ? v.color?.id === selectedColorId : false;
      }
      
      // If variant has size but no color, match only on size
      if (!hasColor && hasSize) {
        return hasSelectedSize ? v.size?.id === selectedSizeId : false;
      }
      
      // If variant has both color and size, match both
      if (hasColor && hasSize) {
        const colorMatch = hasSelectedColor ? v.color?.id === selectedColorId : false;
        const sizeMatch = hasSelectedSize ? v.size?.id === selectedSizeId : false;
        return colorMatch && sizeMatch;
      }
      
      return false;
    }) || null;
  }, [variants, selectedColorId, selectedSizeId]);

  // Get gallery variant index for the selected color
  const getGalleryVariantIndex = useCallback(() => {
    if (!selectedColorId) return 0;
    const selectedColor = availableColors.find(c => c.id === selectedColorId);
    if (!selectedColor) return 0;
    
    const galleryIndex = galleryVariants.findIndex(gv => gv.color === selectedColor.name);
    return galleryIndex >= 0 ? galleryIndex : 0;
  }, [selectedColorId, availableColors, galleryVariants]);

  // Sync with gallery store when color changes - prevent infinite loops
  useEffect(() => {
    const galleryIndex = getGalleryVariantIndex();
    if (lastGalleryIndexRef.current !== galleryIndex) {
      lastGalleryIndexRef.current = galleryIndex;
      setSelected(productId, galleryIndex);
    }
  }, [productId, getGalleryVariantIndex, setSelected]);

  const setSelectedColor = useCallback((colorId: string | null) => {
    setSelectedColorId(colorId);
    
    // Auto-select compatible size if current size is not available with new color
    if (colorId && selectedSizeId) {
      const hasCompatibleVariant = variants.some(v => {
        const hasColor = !!v.color;
        const hasSize = !!v.size;
        
        if (hasColor && hasSize) {
          return v.color?.id === colorId && v.size?.id === selectedSizeId;
        } else if (hasColor && !hasSize) {
          return v.color?.id === colorId;
        } else if (!hasColor && hasSize) {
          return v.size?.id === selectedSizeId;
        }
        return false;
      });
      
      if (!hasCompatibleVariant) {
        // Find first available size for this color
        const availableSize = variants.find(v => {
          if (v.color?.id === colorId) {
            return v.size;
          }
          return false;
        })?.size;
        setSelectedSizeId(availableSize?.id || null);
      }
    }
  }, [variants, selectedSizeId]);

  const setSelectedSize = useCallback((sizeId: string | null) => {
    setSelectedSizeId(sizeId);
    
    // Auto-select compatible color if current color is not available with new size
    if (sizeId && selectedColorId) {
      const hasCompatibleVariant = variants.some(v => {
        const hasColor = !!v.color;
        const hasSize = !!v.size;
        
        if (hasColor && hasSize) {
          return v.color?.id === selectedColorId && v.size?.id === sizeId;
        } else if (hasColor && !hasSize) {
          return v.color?.id === selectedColorId;
        } else if (!hasColor && hasSize) {
          return v.size?.id === sizeId;
        }
        return false;
      });
      
      if (!hasCompatibleVariant) {
        // Find first available color for this size
        const availableColor = variants.find(v => {
          if (v.size?.id === sizeId) {
            return v.color;
          }
          return false;
        })?.color;
        setSelectedColorId(availableColor?.id || null);
      }
    }
  }, [variants, selectedColorId]);

  const contextValue: VariantSelectionContext = {
    selectedColorId,
    selectedSizeId,
    selectedVariant,
    availableColors,
    availableSizes,
    setSelectedColor,
    setSelectedSize,
    getGalleryVariantIndex,
  };

  return (
    <VariantContext.Provider value={contextValue}>
      {children}
    </VariantContext.Provider>
  );
};
