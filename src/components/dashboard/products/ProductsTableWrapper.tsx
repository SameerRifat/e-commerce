// src/components/dashboard/products/ProductsTableWrapper.tsx
"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/dashboard/data-table";
import { renderImage, renderPrice, renderDate, renderBadge } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import type { DashboardProductListItem, DataTableColumn } from "@/types/dashboard";
import { toast } from "sonner";
import DeleteProductDialog from "./delete-product-dialog";

interface ProductsTableWrapperProps {
  data: DashboardProductListItem[];
}

const ProductsTableWrapper: React.FC<ProductsTableWrapperProps> = ({
  data,
}) => {
  const router = useRouter();
  
  // State for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<DashboardProductListItem | null>(null);
  
  // Track which product is being deleted for loading state
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const handleEdit = (product: DashboardProductListItem) => {
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDelete = (product: DashboardProductListItem) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleView = (product: DashboardProductListItem) => {
    router.push(`/dashboard/products/${product.id}`);
  };

  const handleDeleteSuccess = useCallback((productId: string) => {
    // Set loading state
    setDeletingProductId(productId);
    
    // Show success toast
    toast.success("The product has been successfully deleted.");

    // Refresh to get updated data from server
    router.refresh();
    
    // Clear loading state after a short delay
    setTimeout(() => {
      setDeletingProductId(null);
    }, 500);
  }, [router]);

  const columns: DataTableColumn<DashboardProductListItem>[] = [
    {
      key: "images",
      label: "Image",
      render: (value: unknown, product: DashboardProductListItem) => {
        const images = value as DashboardProductListItem["images"];
        const primaryImage = images.find((img) => img.isPrimary) || images[0];
        return renderImage(primaryImage?.url || null, "Product");
      },
      className: "w-16",
    },
    {
      key: "name",
      label: "Product Name",
      render: (value: unknown, product: DashboardProductListItem) => {
        const name = value as string;
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-gray-500 truncate max-w-[200px]">
              {product.description}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              {product.productType === 'simple' ? 'Simple Product' : 'Configurable Product'}
            </div>
          </div>
        );
      },
    },
    {
      key: "brand",
      label: "Brand",
      render: (value: unknown) => {
        const brand = value as DashboardProductListItem["brand"];
        return brand?.name || "—";
      },
    },
    {
      key: "category",
      label: "Category",
      render: (value: unknown) => {
        const category = value as DashboardProductListItem["category"];
        return category?.name || "—";
      },
    },
    {
      key: "price",
      label: "Price",
      render: (_value: unknown, product: DashboardProductListItem) => {
        if (product.productType === 'simple' && product.price) {
          const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
          const regularPrice = parseFloat(product.price);
          
          if (salePrice && salePrice < regularPrice) {
            return (
              <div className="flex flex-col">
                <span className="line-through text-sm text-gray-500">
                  {renderPrice(regularPrice)}
                </span>
                <span className="font-semibold text-green-600">
                  {renderPrice(salePrice)}
                </span>
              </div>
            );
          }
          return renderPrice(regularPrice);
        }
        
        if (!product.variants.length) return "—";
        const prices = product.variants.map((v) => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return renderPrice(minPrice);
        }
        return `${renderPrice(minPrice)} - ${renderPrice(maxPrice)}`;
      },
    },
    {
      key: "stock",
      label: "Stock",
      render: (_value: unknown, product: DashboardProductListItem) => {
        let totalStock = 0;
        
        if (product.productType === 'simple' && product.inStock !== null && product.inStock !== undefined) {
          totalStock = product.inStock;
        } else {
          totalStock = product.variants.reduce((sum, v) => sum + (v.inStock || 0), 0);
        }
        
        return (
          <Badge variant={totalStock > 0 ? "default" : "destructive"}>
            {totalStock}
          </Badge>
        );
      },
    },
    {
      key: "reviews",
      label: "Reviews",
      render: (_value: unknown, product: DashboardProductListItem) => {
        if (product.reviewCount === 0) {
          return (
            <span className="text-sm text-gray-400">No reviews</span>
          );
        }

        const rating = product.averageRating || 0;

        return (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i <= Math.round(rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-300 text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({product.reviewCount})
              </span>
            </div>
          </div>
        );
      },
      className: "w-44",
    },
    {
      key: "isPublished",
      label: "Status",
      render: (value: unknown) => {
        const isPublished = value as boolean;
        return renderBadge(
          isPublished ? "Published" : "Draft",
          isPublished ? "default" : "secondary"
        );
      },
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: (value: unknown) => renderDate(value as Date | string | null),
    },
  ];

  return (
    <>
      <DataTable
        data={data}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No products found. Create your first product to get started."
        isDeleting={(product) => deletingProductId === product.id}
      />

      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={productToDelete}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
};

export default ProductsTableWrapper;