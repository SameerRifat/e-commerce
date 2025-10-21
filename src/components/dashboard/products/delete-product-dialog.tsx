// src/components/dashboard/products/delete-product-dialog.tsx
"use client";

import React, { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ShoppingCart, Package } from "lucide-react";
import { checkProductDeletion, deleteProduct } from "@/lib/actions/delete-product";
import type { DashboardProductListItem } from "@/types/dashboard";

interface DeleteProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: DashboardProductListItem | null;
    onDeleteSuccess: (productId: string) => void;
}

const DeleteProductDialog: React.FC<DeleteProductDialogProps> = ({
    open,
    onOpenChange,
    product,
    onDeleteSuccess,
}) => {
    const [isChecking, setIsChecking] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [canDelete, setCanDelete] = useState<boolean | null>(null);
    const [relatedOrders, setRelatedOrders] = useState<number | null>(null);

    // Check deletion eligibility when dialog opens
    React.useEffect(() => {
        if (open && product) {
            setIsChecking(true);
            setError(null);
            setCanDelete(null);
            setRelatedOrders(null);

            checkProductDeletion(product.id)
                .then((result) => {
                    setCanDelete(result.canDelete || false);
                    setRelatedOrders(result.relatedOrders || null);
                    if (!result.success) {
                        setError(result.reason || "Cannot delete this product");
                    }
                })
                .catch(() => {
                    setError("Failed to check product deletion eligibility");
                    setCanDelete(false);
                })
                .finally(() => {
                    setIsChecking(false);
                });
        }
    }, [open, product]);

    const handleDelete = async () => {
        if (!product || !canDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            const result = await deleteProduct(product.id);

            if (result.success) {
                // Call success callback FIRST
                onDeleteSuccess(product.id);
                
                // THEN close dialog after successful deletion
                onOpenChange(false);
            } else {
                setError(result.error || "Failed to delete product");
            }
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        if (!isDeleting) {
            onOpenChange(false);
            setError(null);
        }
    };

    if (!product) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Delete Product
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                        {isChecking ? (
                            <div className="flex items-center gap-2 py-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Checking product dependencies...</span>
                            </div>
                        ) : canDelete === false ? (
                            <>
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        {error || "This product cannot be deleted"}
                                    </AlertDescription>
                                </Alert>

                                {relatedOrders !== null && relatedOrders > 0 && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-start gap-2">
                                            <ShoppingCart className="h-4 w-4 text-red-600 mt-0.5" />
                                            <div className="text-sm text-red-800">
                                                <p className="font-medium">Order History Conflict</p>
                                                <p className="mt-1">
                                                    This product is referenced in {relatedOrders}{" "}
                                                    {relatedOrders === 1 ? "order" : "orders"}. To maintain
                                                    order history integrity, products with existing orders
                                                    cannot be deleted.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="text-sm text-blue-800">
                                        <p className="font-medium">Alternative: Unpublish</p>
                                        <p className="mt-1">
                                            Consider unpublishing this product instead. This will hide
                                            it from customers while preserving order history.
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-base">
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold text-gray-900">
                                        {product.name}
                                    </span>
                                    ?
                                </p>

                                <Alert>
                                    <Package className="h-4 w-4" />
                                    <AlertDescription>
                                        This action will permanently delete:
                                        <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
                                            <li>The product and all its data</li>
                                            {product.variants.length > 0 && (
                                                <li>{product.variants.length} product variants</li>
                                            )}
                                            {product.images.length > 0 && (
                                                <li>{product.images.length} product images</li>
                                            )}
                                            <li>All reviews and ratings</li>
                                            <li>Wishlist entries</li>
                                            <li>Active cart items</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <p className="text-sm text-red-600 font-medium">
                                    This action cannot be undone.
                                </p>
                            </>
                        )}

                        {error && canDelete !== false && (
                            <Alert variant="destructive" className="mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
                        {canDelete === false ? "Close" : "Cancel"}
                    </AlertDialogCancel>

                    {canDelete && (
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault(); // Prevent default dialog close
                                handleDelete();
                            }}
                            disabled={isDeleting || isChecking}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Product"
                            )}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteProductDialog;