// src/components/ConfigurableProductAddToCart.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, Heart, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { useVariantSelection } from './VariantSelector';

// Import the type from the server action to ensure consistency
import type { FullProduct } from '@/lib/actions/product';

type Variant = FullProduct['variants'][number];

interface ConfigurableProductAddToCartProps {
  productId: string; // Add this back - we need it!
  productName: string;
  variants: Variant[];
}

export default function ConfigurableProductAddToCart({
  productId, // Now we use this
  productName,
  variants,
}: ConfigurableProductAddToCartProps) {
  const { addItem, formatPrice, error, clearError, items } = useCartStore();
  const variantSelection = useVariantSelection();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Get the selected variant from context
  const selectedVariant = variantSelection.selectedVariant;

  // Get available options from variant selection context
  const availableColors = variantSelection.availableColors;
  const availableSizes = variantSelection.availableSizes;
  
  const selectedColorId = variantSelection.selectedColorId;
  const selectedSizeId = variantSelection.selectedSizeId;

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

    return {
      name: productName,
      price: parseFloat(selectedVariant.price),
      salePrice: selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : undefined,
      image: undefined, // Images handled at product level
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

    // Check if this variant is already being added
    const isAlreadyAdding = items.some(item => 
      item.productVariantId === selectedVariant.id && 
      !item.isSimpleProduct && 
      item.pendingOperation === 'add'
    );

    if (isAlreadyAdding) {
      toast.info('This variant is already being added to your cart');
      return;
    }

    setIsAdding(true);

    // Prepare optimistic update data
    const optimisticDetails = getOptimisticProductDetails();

    // Show immediate success feedback
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>Added to cart!</span>
      </div>
    );

    try {
      // FIX: Pass productId for configurable products too!
      // This ensures product_id is populated in both cart_items and order_items tables
      const success = await addItem(productId, selectedVariant.id, false, quantity, optimisticDetails);

      if (!success) {
        // Error handling is now managed by the store and will show rollback
        toast.error('Failed to add item to cart. Your cart has been restored.');
      }
    } finally {
      setIsAdding(false);
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
      {availableColors.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            Color: {availableColors.find(c => c.id === selectedColorId)?.name || 'Select'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {availableColors.map((color) => {
              // Enable selecting any color; the provider will auto-adjust size if incompatible
              const isSelected = selectedColorId === color.id;

              return (
                <button
                  key={color.id}
                  onClick={() => {
                    variantSelection.setSelectedColor(color.id);
                  }}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${isSelected
                      ? 'border-gray-900 shadow-md'
                      : 'border-gray-300 hover:border-gray-400'
                    }`}
                  title={color.name}
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
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">
            Size: {availableSizes.find(s => s.id === selectedSizeId)?.name || 'Select'}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {availableSizes.map((size) => {
              // Enable selecting any size; the provider will auto-adjust color if incompatible
              const isSelected = selectedSizeId === size.id;

              return (
                <button
                  key={size.id}
                  onClick={() => {
                    variantSelection.setSelectedSize(size.id);
                  }}
                  className={`py-3 px-4 border rounded-md text-sm font-medium transition-all ${isSelected
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 hover:border-gray-400 bg-white text-gray-900'
                    }`}
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
          disabled={!selectedVariant || selectedVariant.inStock === 0 || isAdding}
          className="flex items-center justify-center gap-2 h-12 text-base font-medium"
          size="lg"
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </>
          )}
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
          {selectedVariant.color && (
            <p><span className="font-medium">Color:</span> {selectedVariant.color.name}</p>
          )}
          {selectedVariant.size && (
            <p><span className="font-medium">Size:</span> {selectedVariant.size.name}</p>
          )}
        </div>
      )}
    </div>
  );
}