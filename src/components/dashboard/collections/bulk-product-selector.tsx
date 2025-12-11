// src/components/dashboard/collections/bulk-product-selector.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Save, Search, Loader2, Package, X } from "lucide-react";
import { searchProducts } from "@/lib/actions/admin-search";
import { addProductsToCollection, removeProductFromCollection } from "@/lib/actions/collections";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BulkProductSelectorProps {
    collectionId: string;
    existingProductIds: string[];
    onProductsAdded: () => void;
}

export function BulkProductSelector({
    collectionId,
    existingProductIds,
    onProductsAdded,
}: BulkProductSelectorProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [displayedProducts, setDisplayedProducts] = useState<
        Array<{ id: string; name: string; sku: string | null }>
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);

    const PRODUCTS_PER_PAGE = 3;

    // Track products in collection (checked state)
    const [inCollection, setInCollection] = useState<Set<string>>(
        new Set(existingProductIds)
    );

    // Track pending changes
    const [toAdd, setToAdd] = useState<Set<string>>(new Set());
    const [toRemove, setToRemove] = useState<Set<string>>(new Set());

    // Load initial products on mount
    useEffect(() => {
        loadInitialProducts();
    }, []);

    const loadInitialProducts = async () => {
        setIsLoading(true);
        setIsSearchMode(false);
        try {
            const result = await searchProducts("", PRODUCTS_PER_PAGE, 0);
            setDisplayedProducts(result.data);
            setHasMore(result.hasMore);
            setOffset(PRODUCTS_PER_PAGE);
        } catch (error) {
            toast.error("Failed to load products");
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreProducts = async () => {
        if (!hasMore || isLoadingMore || isSearchMode) return;

        setIsLoadingMore(true);
        try {
            const result = await searchProducts("", PRODUCTS_PER_PAGE, offset);
            setDisplayedProducts((prev) => [...prev, ...result.data]);
            setHasMore(result.hasMore);
            setOffset((prev) => prev + PRODUCTS_PER_PAGE);
        } catch (error) {
            toast.error("Failed to load more products");
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Server-side search with debounce
    useEffect(() => {
        if (!searchQuery.trim()) {
            // If search is cleared, reload initial products
            if (isSearchMode) {
                loadInitialProducts();
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            handleSearch();
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSearch = async () => {
        setIsSearching(true);
        setIsSearchMode(true);
        try {
            // Server-side search across ALL products
            const result = await searchProducts(searchQuery, 100, 0);
            setDisplayedProducts(result.data);
            setHasMore(false); // Disable load more during search
            setOffset(0);
        } catch (error) {
            toast.error("Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setIsSearchMode(false);
        loadInitialProducts();
    };

    // Check if product is currently in collection (including pending changes)
    const isProductInCollection = (productId: string): boolean => {
        if (toAdd.has(productId)) return true;
        if (toRemove.has(productId)) return false;
        return inCollection.has(productId);
    };

    // Handle checkbox toggle
    const handleToggleProduct = (productId: string, checked: boolean) => {
        const currentlyInCollection = inCollection.has(productId);

        if (checked) {
            // User wants to add product
            if (currentlyInCollection) {
                // Already in collection, remove from toRemove if present
                setToRemove((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                // Not in collection, add to toAdd
                setToAdd((prev) => new Set(prev).add(productId));
            }
        } else {
            // User wants to remove product
            if (currentlyInCollection) {
                // Currently in collection, add to toRemove
                setToRemove((prev) => new Set(prev).add(productId));
            } else {
                // Not in collection, remove from toAdd
                setToAdd((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            }
        }
    };

    // Handle select all (for current displayed view)
    const handleSelectAll = (checked: boolean) => {
        displayedProducts.forEach((product) => {
            handleToggleProduct(product.id, checked);
        });
    };

    // Apply all pending changes
    const handleApplyChanges = async () => {
        if (toAdd.size === 0 && toRemove.size === 0) {
            toast.info("No changes to apply");
            return;
        }

        setIsSaving(true);
        let addedCount = 0;
        let removedCount = 0;

        try {
            // Add products
            if (toAdd.size > 0) {
                const result = await addProductsToCollection(
                    collectionId,
                    Array.from(toAdd)
                );
                if (result.success) {
                    addedCount = result.data?.added || 0;
                    // Update inCollection state
                    setInCollection((prev) => {
                        const next = new Set(prev);
                        toAdd.forEach((id) => next.add(id));
                        return next;
                    });
                }
            }

            // Remove products
            if (toRemove.size > 0) {
                const removePromises = Array.from(toRemove).map((productId) =>
                    removeProductFromCollection(collectionId, productId)
                );
                const results = await Promise.all(removePromises);
                removedCount = results.filter((r) => r.success).length;

                // Update inCollection state
                setInCollection((prev) => {
                    const next = new Set(prev);
                    toRemove.forEach((id) => next.delete(id));
                    return next;
                });
            }

            // Clear pending changes
            setToAdd(new Set());
            setToRemove(new Set());

            // Show success message
            const messages = [];
            if (addedCount > 0)
                messages.push(`${addedCount} product${addedCount !== 1 ? "s" : ""} added`);
            if (removedCount > 0)
                messages.push(
                    `${removedCount} product${removedCount !== 1 ? "s" : ""} removed`
                );

            toast.success(messages.join(", "));
            onProductsAdded();
            router.refresh();
        } catch (error) {
            toast.error("Failed to apply changes");
        } finally {
            setIsSaving(false);
        }
    };

    // Discard pending changes
    const handleDiscardChanges = () => {
        setToAdd(new Set());
        setToRemove(new Set());
        toast.info("Changes discarded");
    };

    // Calculate stats
    const allChecked =
        displayedProducts.length > 0 &&
        displayedProducts.every((p) => isProductInCollection(p.id));
    const someChecked =
        displayedProducts.some((p) => isProductInCollection(p.id)) && !allChecked;
    const pendingChanges = toAdd.size + toRemove.size;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Bulk Product Management</CardTitle>
                        <CardDescription>
                            Check products to add them, uncheck to remove them from the collection
                        </CardDescription>
                    </div>
                    {pendingChanges > 0 && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            {pendingChanges} pending change{pendingChanges !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            disabled={isLoading}
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {searchQuery && !isSearching && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={handleClearSearch}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Search Mode Indicator */}
                {isSearchMode && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md">
                        <Search className="h-4 w-4" />
                        <span>
                            Showing search results for &quot;{searchQuery}&quot;
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearSearch}
                            className="ml-auto h-6 px-2"
                        >
                            Clear
                        </Button>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Products Table */}
                {!isLoading && displayedProducts.length > 0 && (
                    <>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={allChecked}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all products"
                                                className={someChecked ? "data-[state=indeterminate]:bg-primary" : ""}
                                            />
                                        </TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="w-[200px]">SKU</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedProducts.map((product) => {
                                        const isChecked = isProductInCollection(product.id);
                                        const wasInCollection = inCollection.has(product.id);
                                        const isPendingAdd = toAdd.has(product.id);
                                        const isPendingRemove = toRemove.has(product.id);

                                        return (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) =>
                                                            handleToggleProduct(product.id, checked as boolean)
                                                        }
                                                        aria-label={`Select ${product.name}`}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {product.sku || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    {isPendingAdd && (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                            +Add
                                                        </Badge>
                                                    )}
                                                    {isPendingRemove && (
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                                                            -Remove
                                                        </Badge>
                                                    )}
                                                    {!isPendingAdd && !isPendingRemove && wasInCollection && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            In Collection
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Load More */}
                        {hasMore && !isSearchMode && (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={loadMoreProducts}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        "Load More Products"
                                    )}
                                </Button>
                            </div>
                        )}

                        {/* Action Bar */}
                        <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                                {isSearchMode ? (
                                    <>Showing {displayedProducts.length} search results</>
                                ) : (
                                    <>
                                        Showing {displayedProducts.length} products
                                        {hasMore && " (load more to see all)"}
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {pendingChanges > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={handleDiscardChanges}
                                        disabled={isSaving}
                                    >
                                        Discard
                                    </Button>
                                )}
                                <Button
                                    onClick={handleApplyChanges}
                                    disabled={pendingChanges === 0 || isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Apply Changes ({pendingChanges})
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}

                {/* Empty State - No Products */}
                {!isLoading && !isSearchMode && displayedProducts.length === 0 && (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium mb-1">No products available</h3>
                        <p className="text-sm text-muted-foreground">
                            Create products first to add them to collections
                        </p>
                    </div>
                )}

                {/* Empty State - No Search Results */}
                {!isLoading && isSearchMode && displayedProducts.length === 0 && (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <Search className="h-6 w-6 text-muted-foreground" />
                            </div>
                        </div>
                        <h3 className="text-sm font-medium mb-1">No products found</h3>
                        <p className="text-sm text-muted-foreground">
                            No products match &quot;{searchQuery}&quot;
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClearSearch}
                            className="mt-3"
                        >
                            Clear search
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
