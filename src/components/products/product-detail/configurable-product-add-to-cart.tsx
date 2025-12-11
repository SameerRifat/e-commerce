// src/components/products/product-detail/configurable-product-add-to-cart.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { VariantSelector, useSelectedVariant } from './variant-selector';
import type { FullProduct } from '@/lib/actions/product';

type Variant = FullProduct['variants'][number];

interface ConfigurableProductAddToCartProps {
  productId: string;
  productName: string;
  productSlug: string;
  variants: Variant[];
}

export default function ConfigurableProductAddToCart({
  productId,
  productName,
  productSlug,
  variants,
}: ConfigurableProductAddToCartProps) {
  const { addItem, formatPrice, error, clearError } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // URL-based variant selection (Shopify Hydrogen pattern)
  const selectedVariant = useSelectedVariant(variants);

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

    setIsAdding(true);

    try {
      // Simple pattern: loading → server call → re-fetch (Shopify/WooCommerce approach)
      const success = await addItem(productId, selectedVariant.id, false, quantity);

      if (success) {
        toast.success(
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Added to cart!</span>
          </div>
        );
      } else {
        toast.error('Failed to add item to cart. Please try again.');
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

      {/* Price Display */}
      {selectedVariant && (
        <div className="flex items-center gap-3">
          <p className="text-2xl sm:text-3xl font-semibold sm:font-bold">
            {formatPrice(displayPrice!)}
          </p>
          {compareAtPrice && (
            <>
              <span className="sm:text-xl text-muted-foreground line-through">
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

      {/* Variant Selector (URL-based state management) */}
      <VariantSelector variants={variants} productSlug={productSlug} />

      {/* Stock Status */}
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
          <h3 className="font-medium">Quantity</h3>
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
          className="h-12 text-base font-medium cursor-pointer"
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
