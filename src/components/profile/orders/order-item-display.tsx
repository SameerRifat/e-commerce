// src/components/profile/orders/order-item-display.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Star, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/order-helpers';
import { toast } from 'sonner';
import { ReviewDialog } from './review-dialog';
import { getUserProductReview } from '@/lib/actions/reviews';

interface OrderItemDisplayProps {
  item: {
    id: string;
    quantity: number;
    priceAtPurchase: number;
    salePriceAtPurchase: number | null;
    isSimpleProduct: boolean;
    product?: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      images: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
      }>;
    };
    variant?: {
      id: string;
      sku: string;
      product: {
        id: string;
        name: string;
        slug: string;
      };
      color: {
        id: string;
        name: string;
        hexCode: string;
      } | null;
      size: {
        id: string;
        name: string;
      } | null;
      images: Array<{
        id: string;
        url: string;
        isPrimary: boolean;
      }>;
    };
    reviewStatus?: {
      hasReview: boolean;
      reviewId?: string;
      rating?: number;
      comment?: string | null;
    };
  };
  showFullDetails?: boolean;
  orderStatus?: string;
}

export function OrderItemDisplay({ 
  item, 
  showFullDetails = false,
  orderStatus 
}: OrderItemDisplayProps) {
  const router = useRouter();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isRefreshingReview, setIsRefreshingReview] = useState(false);
  
  // ✅ OPTIMIZED: Use server-provided review status
  const [existingReview, setExistingReview] = useState<{
    id: string;
    rating: number;
    comment: string | null;
  } | undefined>(
    item.reviewStatus?.hasReview && item.reviewStatus.reviewId
      ? {
          id: item.reviewStatus.reviewId,
          rating: item.reviewStatus.rating!,
          comment: item.reviewStatus.comment || null,
        }
      : undefined
  );
  
  const [hasReview, setHasReview] = useState(item.reviewStatus?.hasReview || false);
  
  const finalPrice = item.salePriceAtPurchase ?? item.priceAtPurchase;
  const hasDiscount = item.salePriceAtPurchase && item.salePriceAtPurchase < item.priceAtPurchase;

  // Get product data
  const productId = item.isSimpleProduct 
    ? item.product!.id 
    : item.variant!.product.id;

  const productSlug = item.isSimpleProduct 
    ? item.product!.slug 
    : item.variant!.product.slug;

  const productName = item.isSimpleProduct
    ? item.product!.name
    : item.variant!.product.name;

  const images = item.isSimpleProduct
    ? item.product!.images
    : item.variant!.images;

  const primaryImage = images.find(img => img.isPrimary) || images[0];

  const sku = item.isSimpleProduct
    ? item.product!.sku
    : item.variant!.sku;

  const variantDetails = !item.isSimpleProduct && item.variant
    ? [item.variant.color?.name, item.variant.size?.name]
        .filter(Boolean)
        .join(', ')
    : null;

  // Only show review button for delivered orders
  const canShowReviewButton = orderStatus === 'delivered';

  const handleReviewClick = async () => {
    if (!productId || !productName) {
      toast.error('Unable to identify product');
      return;
    }

    setIsRefreshingReview(true);
    
    try {
      // Fetch fresh review data
      const result = await getUserProductReview(productId);
      
      if (result.success) {
        setExistingReview(result.review);
        setHasReview(!!result.review);
        setIsReviewDialogOpen(true);
      } else {
        toast.error(result.error || 'Failed to load review');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error opening review dialog:', error);
    } finally {
      setIsRefreshingReview(false);
    }
  };

  // ✅ ENHANCED: Use router.refresh() instead of page reload
  const handleReviewSuccess = () => {
    setHasReview(true);
    setIsReviewDialogOpen(false);
    toast.success(
      existingReview 
        ? 'Review updated successfully!' 
        : 'Review submitted successfully! Thank you for your feedback.'
    );
    
    // Refresh server components without full page reload
    router.refresh();
  };

  return (
    <>
      <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
        {/* Product Image */}
        <Link 
          href={`/products/${productSlug}`}
          className="relative w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
        >
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={productName}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-pink-400" />
            </div>
          )}
        </Link>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          {/* Product Name */}
          <Link 
            href={`/products/${productSlug}`}
            className="font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2 text-sm block mb-1"
          >
            {productName}
          </Link>

          {/* Variant Details */}
          {variantDetails && (
            <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
              {item.variant?.color && (
                <div className="flex items-center gap-1">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-200"
                    style={{ backgroundColor: item.variant.color.hexCode }}
                    title={item.variant.color.name}
                  />
                  <span>{item.variant.color.name}</span>
                </div>
              )}
              {item.variant?.size && (
                <>
                  {item.variant?.color && <span>•</span>}
                  <span>{item.variant.size.name}</span>
                </>
              )}
            </div>
          )}

          {/* SKU */}
          {showFullDetails && (
            <p className="text-xs text-gray-400 mb-1">
              SKU: {sku}
            </p>
          )}

          {/* Price Information */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(finalPrice * item.quantity)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(item.priceAtPurchase * item.quantity)}
              </span>
            )}
          </div>

          {/* Quantity */}
          <p className="text-xs text-gray-500 mt-0.5">
            {formatPrice(finalPrice)} × {item.quantity}
            {showFullDetails && ` item${item.quantity > 1 ? 's' : ''}`}
          </p>

          {/* Discount Badge */}
          {showFullDetails && hasDiscount && (
            <div className="mt-2 inline-flex">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Saved {formatPrice((item.priceAtPurchase - item.salePriceAtPurchase!) * item.quantity)}
              </span>
            </div>
          )}

          {/* Review Button */}
          {canShowReviewButton && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                variant={hasReview ? "outline" : "default"}
                size="sm"
                onClick={handleReviewClick}
                disabled={isRefreshingReview}
                className="text-xs h-8"
              >
                {isRefreshingReview ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Loading...
                  </>
                ) : hasReview ? (
                  <>
                    <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                    Edit Review
                  </>
                ) : (
                  <>
                    <Star className="w-3 h-3 mr-1" />
                    Write Review
                  </>
                )}
              </Button>

              {hasReview && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  Reviewed
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Dialog */}
      {productId && productName && (
        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={setIsReviewDialogOpen}
          productId={productId}
          productName={productName}
          existingReview={existingReview}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  );
}