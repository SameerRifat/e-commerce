// src/components/AddToCartSection.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, Heart, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

interface Variant {
  id: string;
  sku: string;
  price: string;
  salePrice?: string | null;
  inStock: number;
  color: {
    id: string;
    name: string;
    slug: string;
    hexCode: string;
  } | null;
  size: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
  } | null;
  images?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
  }>;
}

interface AddToCartSectionProps {
  productId: string;
  productName: string;
  variants: Variant[];
  defaultVariantId?: string | null;
}

export default function AddToCartSection({
  productId,
  productName,
  variants,
  defaultVariantId
}: AddToCartSectionProps) {
  const { addItem, isLoading, formatPrice, openCart, error, clearError } = useCartStore();

  // Get unique colors and sizes from variants
  const uniqueColors = variants.reduce((acc, variant) => {
    if (variant.color && !acc.some(c => c.id === variant.color!.id)) {
      acc.push(variant.color);
    }
    return acc;
  }, [] as NonNullable<Variant['color']>[]);

  const uniqueSizes = variants.reduce((acc, variant) => {
    if (variant.size && !acc.some(s => s.id === variant.size!.id)) {
      acc.push(variant.size);
    }
    return acc;
  }, [] as NonNullable<Variant['size']>[]).sort((a, b) => a.sortOrder - b.sortOrder);

  // Find default variant or first available variant
  const defaultVariant = variants.find(v => v.id === defaultVariantId) || variants[0];

  // State for selected variant options
  const [selectedColorId, setSelectedColorId] = useState<string>(
    defaultVariant?.color?.id || uniqueColors[0]?.id || ''
  );
  const [selectedSizeId, setSelectedSizeId] = useState<string>(
    defaultVariant?.size?.id || uniqueSizes[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);

  // Find the variant that matches selected color and size
  const selectedVariant = variants.find(
    v => v.color?.id === selectedColorId && v.size?.id === selectedSizeId
  );

  // Get available sizes for selected color
  const availableSizesForColor = variants
    .filter(v => v.color?.id === selectedColorId)
    .map(v => v.size)
    .filter((size, index, self) => size && self.findIndex(s => s?.id === size.id) === index)
    .sort((a, b) => (a?.sortOrder || 0) - (b?.sortOrder || 0));

  // Get available colors for selected size
  const availableColorsForSize = variants
    .filter(v => v.size?.id === selectedSizeId)
    .map(v => v.color)
    .filter((color, index, self) => color && self.findIndex(c => c?.id === color.id) === index);

  // Prepare optimistic product details
  const getOptimisticProductDetails = () => {
    if (!selectedVariant) return undefined;

    // Get primary image or first available image
    const primaryImage = selectedVariant.images?.find(img => img.isPrimary) || selectedVariant.images?.[0];

    return {
      name: productName,
      price: parseFloat(selectedVariant.price),
      salePrice: selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : undefined,
      image: primaryImage?.url,
      color: {
        name: selectedVariant.color?.name || 'Unknown',
        hexCode: selectedVariant.color?.hexCode || '#000000',
      },
      size: {
        name: selectedVariant.size?.name || 'Unknown',
      },
      sku: selectedVariant.sku,
      inStock: selectedVariant.inStock,
    };
  };

  const handleAddToCart = async () => {
    // Clear any previous errors
    if (error) clearError();

    if (!selectedVariant) {
      toast.error('Please select a color and size');
      return;
    }

    if (selectedVariant.inStock === 0) {
      toast.error('This variant is out of stock');
      return;
    }

    if (quantity > selectedVariant.inStock) {
      toast.error(`Only ${selectedVariant.inStock} items available in stock`);
      return;
    }

    // Prepare optimistic update data
    const optimisticDetails = getOptimisticProductDetails();

    // Show immediate success feedback
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>Added to cart!</span>
      </div>
    );

    // Add item with optimistic update
    const success = await addItem(selectedVariant.id, quantity, optimisticDetails);

    if (!success) {
      // Error handling is now managed by the store and will show rollback
      toast.error('Failed to add item to cart. Your cart has been restored.');
    } else {
      // Optionally open cart to show the new item
      // openCart();
    }
  };

  const displayPrice = selectedVariant ? (
    selectedVariant.salePrice
      ? parseFloat(selectedVariant.salePrice)
      : parseFloat(selectedVariant.price)
  ) : null;

  const compareAtPrice = selectedVariant?.salePrice
    ? parseFloat(selectedVariant.price)
    : null;

  const discount = compareAtPrice && displayPrice && compareAtPrice > displayPrice
    ? Math.round(((compareAtPrice - displayPrice) / compareAtPrice) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button 
            onClick={clearError}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Price Display */}
      {selectedVariant && (
        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold text-gray-900">
            {formatPrice(displayPrice!)}
          </p>
          {compareAtPrice && (
            <>
              <span className="text-xl text-gray-500 line-through">
                {formatPrice(compareAtPrice)}
              </span>
              {discount && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-medium">
                  {discount}% off
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            Color: {uniqueColors.find(c => c.id === selectedColorId)?.name || 'Select'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {uniqueColors.map((color) => {
              const isAvailable = availableColorsForSize.some(c => c?.id === color.id);
              const isSelected = selectedColorId === color.id;

              return (
                <button
                  key={color.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedColorId(color.id);
                      // Auto-select first available size for this color if current size is not available
                      const firstAvailableSize = availableSizesForColor.find(s =>
                        variants.some(v => v.color?.id === color.id && v.size?.id === s?.id)
                      );
                      if (firstAvailableSize && !availableSizesForColor.some(s => s?.id === selectedSizeId)) {
                        setSelectedSizeId(firstAvailableSize.id);
                      }
                    }
                  }}
                  disabled={!isAvailable}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${isSelected
                      ? 'border-gray-900 shadow-md'
                      : isAvailable
                        ? 'border-gray-300 hover:border-gray-400'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  title={`${color.name}${!isAvailable ? ' (not available in selected size)' : ''}`}
                >
                  <div
                    className="w-8 h-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {uniqueSizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            Size: {uniqueSizes.find(s => s.id === selectedSizeId)?.name || 'Select'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {uniqueSizes.map((size) => {
              const isAvailable = availableSizesForColor.some(s => s?.id === size.id);
              const isSelected = selectedSizeId === size.id;

              return (
                <button
                  key={size.id}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedSizeId(size.id);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`py-3 px-4 border rounded-md text-sm font-medium transition-all ${isSelected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : isAvailable
                        ? 'border-gray-300 hover:border-gray-400 bg-white text-gray-900'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  title={!isAvailable ? 'Not available in selected color' : ''}
                >
                  {size.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="flex items-center gap-2">
          {selectedVariant.inStock > 0 ? (
            selectedVariant.inStock <= 5 ? (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Only {selectedVariant.inStock} left in stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-4 h-4" />
                <span className="text-sm">In stock</span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Out of stock</span>
            </div>
          )}
        </div>
      )}

      {/* Quantity Selection */}
      {selectedVariant && selectedVariant.inStock > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Quantity</h3>
          <div className="flex items-center border rounded-md w-fit">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              −
            </button>
            <span className="px-4 py-2 border-x min-w-[3rem] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(selectedVariant.inStock, quantity + 1))}
              disabled={quantity >= selectedVariant.inStock}
              className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.inStock === 0}
          className="flex items-center justify-center gap-2 h-12 text-base font-medium"
          size="lg"
        >
          <ShoppingBag className="h-5 w-5" />
          Add to Cart
        </Button>

        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 h-12 text-base font-medium"
          size="lg"
        >
          <Heart className="h-5 w-5" />
          Add to Wishlist
        </Button>
      </div>

      {/* Product Details */}
      {selectedVariant && (
        <div className="pt-4 border-t text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">SKU:</span> {selectedVariant.sku}</p>
          <p><span className="font-medium">Color:</span> {selectedVariant.color?.name}</p>
          <p><span className="font-medium">Size:</span> {selectedVariant.size?.name}</p>
        </div>
      )}
    </div>
  );
}