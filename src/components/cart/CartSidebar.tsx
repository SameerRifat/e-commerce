// src/components/cart/CartSidebar.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCartStore } from '@/store/cart';
import { useEffect } from 'react';

const CartSidebar = () => {
    const { 
        isOpen, 
        items, 
        total, 
        isLoading,
        toggleCart, 
        getItemCount, 
        updateQuantity, 
        removeItem,
        formatPrice,
        syncWithServer 
    } = useCartStore();

    // Sync with server when component mounts or cart opens
    useEffect(() => {
        if (isOpen) {
            syncWithServer();
        }
    }, [isOpen, syncWithServer]);

    // Also sync on initial mount
    useEffect(() => {
        syncWithServer();
    }, [syncWithServer]);

    const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
        await updateQuantity(cartItemId, newQuantity);
    };

    const handleRemoveItem = async (cartItemId: string) => {
        await removeItem(cartItemId);
    };


    console.log('[CartSidebar] ITEMS:', JSON.stringify(items, null, 2));

    return (
        <Sheet open={isOpen} onOpenChange={toggleCart}>
            <SheetContent side="right" className="w-full sm:w-96 flex flex-col h-full p-0 gap-0">
                {/* Fixed Header */}
                <div className="flex-shrink-0">
                    <SheetHeader className="p-6 pb-0">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5" />
                            Shopping Cart ({getItemCount()})
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </SheetTitle>
                    </SheetHeader>
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center p-6">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                        <p className="text-muted-foreground mb-6">
                            Add some beautiful cosmetics to get started
                        </p>
                        <Button asChild onClick={toggleCart}>
                            <Link href="/products">
                                Continue Shopping
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Scrollable Content Area */}
                        <div className="flex-1 min-h-0">
                            <ScrollArea className="h-full py-4">
                                <div className="space-y-4 px-6">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-4 p-4 border rounded-lg bg-card"
                                        >
                                            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-50 to-rose-50 rounded-md overflow-hidden flex-shrink-0">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                                        <ShoppingBag className="h-6 w-6 text-pink-400" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-1">
                                                <h4 className="font-medium text-sm line-clamp-2">
                                                    <Link 
                                                        href={`/products/${item.productId}`}
                                                        className="hover:text-primary transition-colors"
                                                        onClick={() => toggleCart()}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </h4>
                                                
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {/* Color swatch and name */}
                                                    {item.color && (
                                                        <div className="flex items-center gap-1">
                                                            <div 
                                                                className="w-3 h-3 rounded-full border border-gray-200"
                                                                style={{ backgroundColor: item.color.hexCode }}
                                                                title={item.color.name}
                                                            />
                                                            <span>{item.color.name}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Size */}
                                                    {item.size && (
                                                        <>
                                                            {item.color && <span>•</span>}
                                                            <span>{item.size.name}</span>
                                                        </>
                                                    )}
                                                    
                                                    {/* Stock status */}
                                                    {item.inStock <= 5 && (
                                                        <>
                                                            {(item.color || item.size) && <span>•</span>}
                                                            <span className="text-orange-600">
                                                                {item.inStock === 0 ? 'Out of stock' : `Only ${item.inStock} left`}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {item.salePrice ? (
                                                        <>
                                                            <span className="font-semibold text-primary">
                                                                {formatPrice(item.salePrice)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground line-through">
                                                                {formatPrice(item.price)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="font-semibold text-primary">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={isLoading}
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="text-sm font-medium w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={isLoading || item.inStock === 0}
                                                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-destructive hover:text-destructive"
                                                        disabled={isLoading}
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 border-t bg-background">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between text-lg font-semibold">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatPrice(total)}</span>
                                </div>

                                <div className="space-y-2">
                                    <Button variant="default" className="w-full">
                                        Proceed to Checkout
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={toggleCart} asChild>
                                        <Link href="/products">
                                            Continue Shopping
                                        </Link>
                                    </Button>
                                </div>

                                <div className="text-center text-sm text-muted-foreground">
                                    <p>Free shipping on orders over Rs.2,500</p>
                                    <p>Authentic cosmetics • Cash on Delivery available</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default CartSidebar;