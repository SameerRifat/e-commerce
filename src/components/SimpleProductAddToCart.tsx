// src/components/SimpleProductAddToCart.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, Heart, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';

interface SimpleProductAddToCartProps {
  productId: string;
  productName: string;
  product: {
    id: string;
    name: string;
    productType: 'simple';
    price?: string | null;
    salePrice?: string | null;
    sku?: string | null;
    inStock?: number | null;
  };
}

export default function SimpleProductAddToCart({
  productId,
  productName,
  product,
}: SimpleProductAddToCartProps) {
  const { addItem, formatPrice, error, clearError, items } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Use product data directly for simple products
  const selectedProduct = {
    id: productId,
    sku: product.sku || `simple-${productId}`,
    price: product.price || '0',
    salePrice: product.salePrice || null,
    inStock: product.inStock ?? 0,
  };

  // Prepare optimistic product details
  const getOptimisticProductDetails = () => {
    if (!selectedProduct) return undefined;

    return {
      name: productName,
      price: parseFloat(selectedProduct.price),
      salePrice: selectedProduct.salePrice ? parseFloat(selectedProduct.salePrice) : undefined,
      image: undefined, // Simple products don't have variant-specific images
      sku: selectedProduct.sku,
      inStock: selectedProduct.inStock,
    };
  };

  const handleAddToCart = async () => {
    // Clear any previous errors
    if (error) clearError();

    if (!selectedProduct) {
      toast.error('Product not available');
      return;
    }

    if (selectedProduct.inStock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    if (quantity > selectedProduct.inStock) {
      toast.error(`Only ${selectedProduct.inStock} items available in stock`);
      return;
    }

    // Check if this product is already being added
    const isAlreadyAdding = items.some(item => 
      item.productId === selectedProduct.id && 
      item.isSimpleProduct && 
      item.pendingOperation === 'add'
    );

    if (isAlreadyAdding) {
      toast.info('This item is already being added to your cart');
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
      // Add item with optimistic update - use productId for simple products
      const success = await addItem(selectedProduct.id, null, true, quantity, optimisticDetails);

      if (!success) {
        // Error handling is now managed by the store and will show rollback
        toast.error('Failed to add item to cart. Your cart has been restored.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const displayPrice = selectedProduct ? (
    selectedProduct.salePrice
      ? parseFloat(selectedProduct.salePrice)
      : parseFloat(selectedProduct.price)
  ) : null;

  const compareAtPrice = selectedProduct?.salePrice
    ? parseFloat(selectedProduct.price)
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
      {selectedProduct && (
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

      {/* Stock Status */}
      {selectedProduct && (
        <div className="flex items-center gap-2">
          {selectedProduct.inStock > 0 ? (
            selectedProduct.inStock <= 5 ? (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Only {selectedProduct.inStock} left in stock</span>
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
      {selectedProduct && selectedProduct.inStock > 0 && (
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
              onClick={() => setQuantity(Math.min(selectedProduct.inStock, quantity + 1))}
              disabled={quantity >= selectedProduct.inStock}
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
          disabled={!selectedProduct || selectedProduct.inStock === 0 || isAdding}
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
      {selectedProduct && (
        <div className="pt-4 border-t text-sm text-gray-600 space-y-1">
          <p><span className="font-medium">SKU:</span> {selectedProduct.sku}</p>
          <p><span className="font-medium">Product Type:</span> Simple Product</p>
        </div>
      )}
    </div>
  );
}
