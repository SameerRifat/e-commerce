// src/components/products/product-detail/simple-product-add-to-cart.tsx
'use client';

import { useState } from 'react';
import { ShoppingBag, AlertCircle, Check, Package, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
    weight?: number | null;
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
    } | null;
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

  const selectedProduct = {
    id: productId,
    sku: product.sku || `simple-${productId}`,
    price: product.price || '0',
    salePrice: product.salePrice || null,
    inStock: product.inStock ?? 0,
  };

  const getOptimisticProductDetails = () => {
    if (!selectedProduct) return undefined;

    return {
      name: productName,
      price: parseFloat(selectedProduct.price),
      salePrice: selectedProduct.salePrice ? parseFloat(selectedProduct.salePrice) : undefined,
      image: undefined,
      sku: selectedProduct.sku,
      inStock: selectedProduct.inStock,
    };
  };

  const handleAddToCart = async () => {
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

    const optimisticDetails = getOptimisticProductDetails();

    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>Added to cart!</span>
      </div>
    );

    try {
      const success = await addItem(selectedProduct.id, null, true, quantity, optimisticDetails);

      if (!success) {
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
                <Badge className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
                  {discount}% off
                </Badge>
              )}
            </>
          )}
        </div>
      )}

      {/* Stock Status with Shadcn Badge */}
      {selectedProduct && (
        <div className="flex items-center gap-2">
          {selectedProduct.inStock > 0 ? (
            selectedProduct.inStock <= 5 ? (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                Only {selectedProduct.inStock} left in stock
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
      {selectedProduct && selectedProduct.inStock > 0 && (
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
              onClick={() => setQuantity(Math.min(selectedProduct.inStock, quantity + 1))}
              disabled={quantity >= selectedProduct.inStock}
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
          disabled={!selectedProduct || selectedProduct.inStock === 0 || isAdding}
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

      {/* Product Specifications - Useful Info Only */}
      {(product.sku || product.weight || product.dimensions) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Product Information</h3>
            <div className="text-sm text-gray-600 space-y-2">
              {product.sku && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Item Code:</span>
                  <span className="font-medium">{product.sku}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-medium">{product.weight}g</span>
                </div>
              )}
              {product.dimensions && (
                product.dimensions.length ||
                product.dimensions.width ||
                product.dimensions.height
              ) && (
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Dimensions:</span>
                    <span className="font-medium">
                      {product.dimensions.length || 0} × {product.dimensions.width || 0} × {product.dimensions.height || 0} cm
                    </span>
                  </div>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}