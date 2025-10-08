// src/components/profile/orders/order-item-display.tsx

import Image from 'next/image';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils/order-helpers';

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
    };
    showFullDetails?: boolean;
}

export const OrderItemDisplay = ({ item, showFullDetails = false }: OrderItemDisplayProps) => {
    const getItemName = () => {
        if (item.isSimpleProduct && item.product) {
            return item.product.name;
        }
        if (!item.isSimpleProduct && item.variant) {
            return item.variant.product.name;
        }
        return 'Unknown Product';
    };

    const getProductId = () => {
        if (item.isSimpleProduct && item.product) {
            return item.product.id;
        }
        if (!item.isSimpleProduct && item.variant) {
            return item.variant.product.id;
        }
        return null;
    };

    const getItemImage = () => {
        if (item.isSimpleProduct && item.product?.images?.length) {
            return item.product.images.find(img => img.isPrimary)?.url || item.product.images[0].url;
        }
        if (!item.isSimpleProduct && item.variant?.images?.length) {
            return item.variant.images.find(img => img.isPrimary)?.url || item.variant.images[0].url;
        }
        return null;
    };

    const getVariantDetails = () => {
        if (!item.variant) return null;

        const details = [];
        if (item.variant.color) {
            details.push(item.variant.color.name);
        }
        if (item.variant.size) {
            details.push(item.variant.size.name);
        }
        return details.length > 0 ? details.join(' • ') : null;
    };

    const getTotalPrice = () => {
        const price = item.salePriceAtPurchase || item.priceAtPurchase;
        return price * item.quantity;
    };

    const imageUrl = getItemImage();
    const variantDetails = getVariantDetails();
    const productId = getProductId();

    // Content wrapper
    const ItemContent = (
        <>
            {/* Product Image */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg overflow-hidden flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={getItemName()}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-pink-400" />
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight line-clamp-2 mb-1 hover:text-primary transition-colors">
                    {getItemName()}
                </h4>

                {/* Variant Details */}
                {variantDetails && (
                    <div className="flex items-center gap-2 mb-1">
                        {item.variant?.color && (
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full border border-gray-200"
                                    style={{ backgroundColor: item.variant.color.hexCode }}
                                />
                                <span className="text-xs text-muted-foreground">
                                    {item.variant.color.name}
                                </span>
                            </div>
                        )}
                        {item.variant?.size && (
                            <div className="flex items-center gap-1">
                                {item.variant?.color && <span className="text-xs text-muted-foreground">•</span>}
                                <span className="text-xs text-muted-foreground">
                                    {item.variant.size.name}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Quantity and Price */}
                <div className="text-sm text-muted-foreground">
                    <span>Qty: {item.quantity}</span>
                    {showFullDetails && (
                        <span className="ml-2">
                            × {item.salePriceAtPurchase
                                ? formatPrice(item.salePriceAtPurchase)
                                : formatPrice(item.priceAtPurchase)
                            }
                        </span>
                    )}
                </div>

                {/* SKU for detailed view */}
                {showFullDetails && (
                    <div className="text-xs text-muted-foreground mt-1">
                        SKU: {item.isSimpleProduct ? item.product?.sku : item.variant?.sku}
                    </div>
                )}
            </div>

            {/* Total Price */}
            <div className="text-right">
                {item.salePriceAtPurchase && item.salePriceAtPurchase !== item.priceAtPurchase ? (
                    <div className="space-y-1">
                        <div className="font-semibold text-sm">
                            {formatPrice(getTotalPrice())}
                        </div>
                        <div className="text-xs text-muted-foreground line-through">
                            {formatPrice(item.priceAtPurchase * item.quantity)}
                        </div>
                    </div>
                ) : (
                    <div className="font-semibold text-sm">
                        {formatPrice(getTotalPrice())}
                    </div>
                )}
            </div>
        </>
    );

    // If we have a product ID, make it clickable
    if (productId) {
        return (
            <Link
                href={`/products/${productId}`}
                className={`flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30 hover:border-primary/50 transition-all cursor-pointer ${
                    showFullDetails ? 'bg-white' : ''
                }`}
            >
                {ItemContent}
            </Link>
        );
    }

    // Fallback: non-clickable if no product ID
    return (
        <div className={`flex items-center gap-4 p-3 border rounded-lg ${showFullDetails ? 'bg-white' : ''}`}>
            {ItemContent}
        </div>
    );
};