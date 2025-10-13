// src/components/ConfigurableProductAddToCart.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { useVariantSelection } from '../../VariantSelector';
import type { FullProduct } from '@/lib/actions/product';

type Variant = FullProduct['variants'][number];

interface ConfigurableProductAddToCartProps {
  productId: string;
  productName: string;
  variants: Variant[];
}

export default function ConfigurableProductAddToCart({
  productId,
  productName,
  variants,
}: ConfigurableProductAddToCartProps) {
  const { addItem, formatPrice, error, clearError, items } = useCartStore();
  const variantSelection = useVariantSelection();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const selectedVariant = variantSelection.selectedVariant;
  const availableColors = variantSelection.availableColors;
  const availableSizes = variantSelection.availableSizes;
  const selectedColorId = variantSelection.selectedColorId;
  const selectedSizeId = variantSelection.selectedSizeId;

  const getOptimisticProductDetails = () => {
    if (!selectedVariant) return undefined;

    return {
      name: productName,
      price: parseFloat(selectedVariant.price),
      salePrice: selectedVariant.salePrice ? parseFloat(selectedVariant.salePrice) : undefined,
      image: undefined,
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

    const optimisticDetails = getOptimisticProductDetails();

    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>Added to cart!</span>
      </div>
    );

    try {
      const success = await addItem(productId, selectedVariant.id, false, quantity, optimisticDetails);

      if (!success) {
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
      {/* Error Display with Shadcn Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-auto p-0 hover:bg-transparent"
            >
              ✕
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Price Display with Shadcn Badge */}
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
                <Badge className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
                  {discount}% off
                </Badge>
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
              const isSelected = selectedColorId === color.id;

              return (
                <Button
                  key={color.id}
                  variant="ghost"
                  size="icon"
                  onClick={() => variantSelection.setSelectedColor(color.id)}
                  className={`relative w-12 h-12 rounded-full border-2 p-0 ${isSelected
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
                </Button>
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
          <div className="grid grid-cols-4 2xl:grid-cols-5 gap-3">
            {availableSizes.map((size) => {
              const isSelected = selectedSizeId === size.id;

              return (
                <Button
                  key={size.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => variantSelection.setSelectedSize(size.id)}
                  className="text-sm font-medium"
                >
                  {size.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Status with Shadcn Badge */}
      {selectedVariant && (
        <div className="flex items-center gap-2">
          {selectedVariant.inStock > 0 ? (
            selectedVariant.inStock <= 5 ? (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Only {selectedVariant.inStock} left in stock
              </Badge>
            ) : (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Check className="w-4 h-4 mr-1" />
                In stock
              </Badge>
            )
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="w-4 h-4 mr-1" />
              Out of stock
            </Badge>
          )}
        </div>
      )}

      {/* Quantity Selection */}
      {selectedVariant && selectedVariant.inStock > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Quantity</h3>
          <div className="flex items-center border rounded-md w-fit">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="px-3 rounded-none"
            >
              −
            </Button>
            <span className="px-4 py-2 border-x min-w-[3rem] text-center">{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuantity(Math.min(selectedVariant.inStock, quantity + 1))}
              disabled={quantity >= selectedVariant.inStock}
              className="px-3 rounded-none"
            >
              +
            </Button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || selectedVariant.inStock === 0 || isAdding}
          className="h-12 text-base font-medium"
          size="lg"
        >
          {isAdding ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Adding to Cart...
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}