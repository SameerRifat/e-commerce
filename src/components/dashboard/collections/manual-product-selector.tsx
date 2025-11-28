// src/components/dashboard/collections/manual-product-selector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";
import { searchProducts, getProductById } from "@/lib/actions/hero-slides-search";
import {
    addProductsToCollection,
    removeProductFromCollection,
    getCollectionProductsById, // ✅ NEW: Import the function
} from "@/lib/actions/collections";
import { toast } from "sonner";
import { SearchableCombobox } from "../hero-slides/searchable-combobox";

interface ManualProductSelectorProps {
    collectionId?: string;
    mode: "create" | "edit";
}

// ✅ FIXED: Define proper type for products
interface CollectionProduct {
    id: string;
    name: string;
    sku: string | null;
}

const ManualProductSelector: React.FC<ManualProductSelectorProps> = ({
    collectionId,
    mode,
}) => {
    // ✅ FIXED: Properly typed state with explicit type annotation
    const [selectedProducts, setSelectedProducts] = useState<CollectionProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingProduct, setIsAddingProduct] = useState(false);

    // Load existing products if in edit mode
    useEffect(() => {
        if (mode === "edit" && collectionId) {
            loadCollectionProducts();
        }
    }, [mode, collectionId]);

    // ✅ FIXED: Implement the loadCollectionProducts function
    const loadCollectionProducts = async () => {
        if (!collectionId) return;

        setIsLoading(true);
        try {
            const result = await getCollectionProductsById(collectionId);
            if (result.success && result.data) {
                // ✅ FIXED: Explicitly typed products array
                const products: CollectionProduct[] = result.data.map((p) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                }));
                setSelectedProducts(products);
            } else {
                toast.error(result.error || "Failed to load collection products");
            }
        } catch (error) {
            console.error("Error loading products:", error);
            toast.error("Failed to load collection products");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddProduct = async () => {
        if (!selectedProductId) return;

        // Check if already added
        if (selectedProducts.some((p) => p.id === selectedProductId)) {
            toast.error("Product already in collection");
            return;
        }

        setIsAddingProduct(true);
        try {
            const product = await getProductById(selectedProductId);
            if (product) {
                // ✅ FIXED: Properly typed product object
                const newProduct: CollectionProduct = {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                };
                
                setSelectedProducts((prev) => [...prev, newProduct]);

                // If in edit mode, save to database immediately
                if (mode === "edit" && collectionId) {
                    const result = await addProductsToCollection(collectionId, [
                        selectedProductId,
                    ]);
                    if (result.success) {
                        toast.success("Product added to collection");
                    } else {
                        toast.error("Failed to add product");
                        // Revert
                        setSelectedProducts((prev) =>
                            prev.filter((p) => p.id !== selectedProductId)
                        );
                    }
                }

                setSelectedProductId(null);
            }
        } catch (error) {
            console.error("Error adding product:", error);
            toast.error("Failed to add product");
        } finally {
            setIsAddingProduct(false);
        }
    };

    const handleRemoveProduct = async (productId: string) => {
        // Store the removed product for potential revert
        const removedProduct = selectedProducts.find((p) => p.id === productId);
        
        setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));

        // If in edit mode, remove from database
        if (mode === "edit" && collectionId) {
            const result = await removeProductFromCollection(collectionId, productId);
            if (result.success) {
                toast.success("Product removed from collection");
            } else {
                toast.error("Failed to remove product");
                // Revert
                if (removedProduct) {
                    setSelectedProducts((prev) => [...prev, removedProduct]);
                }
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Collection Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {mode === "create" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                            <strong>Note:</strong> You can add products to this collection after
                            creating it. Save the collection first, then come back to add products.
                        </p>
                    </div>
                )}

                {mode === "edit" && (
                    <>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <SearchableCombobox
                                    value={selectedProductId || undefined}
                                    onValueChange={(value) => setSelectedProductId(value)}
                                    placeholder="Search and select a product..."
                                    searchPlaceholder="Search products by name or SKU..."
                                    emptyMessage="No products found."
                                    onSearch={async (query, offset) => {
                                        const result = await searchProducts(query, 20, offset);
                                        return {
                                            data: result.data.map((p) => ({
                                                id: p.id,
                                                name: p.name,
                                                meta: p.sku || undefined,
                                            })),
                                            hasMore: result.hasMore,
                                        };
                                    }}
                                    onGetById={async (id) => {
                                        const product = await getProductById(id);
                                        if (!product) return null;
                                        return {
                                            id: product.id,
                                            name: product.name,
                                            meta: product.sku || undefined,
                                        };
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddProduct}
                                disabled={!selectedProductId || isAddingProduct}
                            >
                                {isAddingProduct ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add
                                    </>
                                )}
                            </Button>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : selectedProducts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No products added to this collection yet.</p>
                                <p className="text-sm mt-1">
                                    Use the search above to add products.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {selectedProducts.length} product{selectedProducts.length !== 1 ? "s" : ""} in
                                    collection
                                </p>
                                <div className="border rounded-lg divide-y">
                                    {selectedProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex items-center justify-between p-3 hover:bg-gray-50"
                                        >
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                {product.sku && (
                                                    <p className="text-xs text-muted-foreground">
                                                        SKU: {product.sku}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveProduct(product.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default ManualProductSelector;