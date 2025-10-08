'use client'

import Image from "next/image";
import Link from "next/link";
import { Heart, Star, Eye } from "lucide-react";
import { useState } from "react";

export interface ProductCardProps {
  title: string;
  description?: string;
  subtitle?: string;
  meta?: string | string[];
  imageSrc: string;
  hoverImageSrc?: string | null;
  imageAlt?: string;
  price?: string | number;
  salePrice?: string | number | null;
  discountPercentage?: number | null;
  href?: string;
  className?: string;
  averageRating?: number | null;
  reviewCount?: number;
}

export default function ProductCard({
  title,
  description,
  subtitle,
  meta,
  imageSrc,
  hoverImageSrc,
  imageAlt = title,
  price,
  salePrice,
  discountPercentage,
  href,
  className = "",
  averageRating,
  reviewCount = 0,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Parse prices
  const originalPrice = price === undefined ? undefined : typeof price === "number" ? price : parseFloat(price);
  const salePriceValue = salePrice === undefined || salePrice === null 
    ? null 
    : typeof salePrice === "number" ? salePrice : parseFloat(salePrice);

  // Determine if there's an active discount
  const hasDiscount = salePriceValue !== null && originalPrice !== undefined && salePriceValue < originalPrice;
  
  // Show discount badge only if discount is 5% or more
  const showDiscountBadge = hasDiscount && discountPercentage !== null && discountPercentage !== undefined && discountPercentage >= 5;

  // Format prices for display
  const formatPrice = (p: number) => `PKR ${p.toFixed(2)}`;
  const displayPrice = originalPrice !== undefined ? formatPrice(originalPrice) : undefined;
  const displaySalePrice = salePriceValue !== null ? formatPrice(salePriceValue) : null;

  // Use real rating data or show no stars if no reviews
  const rating = averageRating ?? 0;
  const hasReviews = reviewCount > 0;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  // Determine which image to show
  const currentImageSrc = isHovered && hoverImageSrc ? hoverImageSrc : imageSrc;

  const content = (
    <div 
      className="group overflow-hidden relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
        <Image
          src={currentImageSrc}
          alt={imageAlt}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-all duration-300 group-hover:scale-105"
          key={currentImageSrc}
        />

        {/* Discount Badge - Top Left */}
        {showDiscountBadge && (
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
              {discountPercentage}% OFF
            </div>
          </div>
        )}

        {/* Quick Actions - Top Right */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            className="p-2 bg-white rounded-full shadow-lg hover:bg-orange-500 hover:text-white transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to wishlist functionality
            }}
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* View Details Overlay - Bottom */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center justify-center gap-2 text-white text-sm font-medium">
            <Eye className="h-4 w-4" />
            View Details
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-0 pt-2 sm:pt-3">
        {/* Product Name */}
        <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {title}
        </h3>

        {/* Rating - Only show if there are reviews */}
        {hasReviews && (
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
            <div className="flex items-center">
              {renderStars(rating)}
            </div>
            <span className="text-[10px] sm:text-xs text-gray-500">
              ({reviewCount})
            </span>
          </div>
        )}

        {/* No reviews message */}
        {!hasReviews && (
          <div className="mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs text-gray-400 italic">
              No reviews yet
            </span>
          </div>
        )}

        {/* Description/Subtitle */}
        {(description || subtitle) && (
          <p className="text-[10px] sm:text-xs text-gray-500 mb-2 sm:mb-3 line-clamp-2">
            {description || subtitle}
          </p>
        )}

        {/* Price Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {hasDiscount ? (
            <>
              {/* Sale Price - Prominent */}
              <span className="font-bold text-sm sm:text-lg text-orange-500">
                {displaySalePrice}
              </span>
              {/* Original Price - Strikethrough */}
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                {displayPrice}
              </span>
            </>
          ) : (
            /* Regular Price */
            displayPrice && (
              <span className="font-bold text-sm sm:text-lg text-orange-500">
                {displayPrice}
              </span>
            )
          )}
        </div>

        {/* Meta Info */}
        {meta && (
          <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
            {Array.isArray(meta) ? meta.join(" • ") : meta}
          </p>
        )}
      </div>
    </div>
  );

  return href ? (
    <Link
      href={href}
      aria-label={title}
    >
      {content}
    </Link>
  ) : (
    content
  );
}