"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DataTable from "@/components/dashboard/data-table";
import { renderImage, renderPrice, renderDate, renderBadge } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import type { DashboardProductListItem, DataTableColumn } from "@/types/dashboard";

interface ProductsTableWrapperProps {
  data: DashboardProductListItem[];
}

const ProductsTableWrapper: React.FC<ProductsTableWrapperProps> = ({
  data,
}) => {
  const router = useRouter();

  const handleEdit = (product: DashboardProductListItem) => {
    router.push(`/dashboard/products/${product.id}/edit`);
  };

  const handleDelete = (product: DashboardProductListItem) => {
    // This would typically trigger a confirmation dialog
    console.log("Delete product:", product.id);
    // TODO: Implement delete functionality
  };

  const handleView = (product: DashboardProductListItem) => {
    router.push(`/dashboard/products/${product.id}`);
  };

  // Define columns in the client component to avoid server/client boundary issues
  const columns: DataTableColumn<DashboardProductListItem>[] = [
    {
      key: "images",
      label: "Image",
      render: (images: DashboardProductListItem["images"]) => {
        const primaryImage = images.find((img) => img.isPrimary) || images[0];
        return renderImage(primaryImage?.url || null, "Product");
      },
      className: "w-16",
    },
    {
      key: "name",
      label: "Product Name",
      render: (name: string, product: DashboardProductListItem) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500 truncate max-w-[200px]">
            {product.description}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {product.productType === 'simple' ? 'Simple Product' : 'Configurable Product'}
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      label: "Brand",
      render: (brand: DashboardProductListItem["brand"]) => brand?.name || "—",
    },
    {
      key: "category",
      label: "Category",
      render: (category: DashboardProductListItem["category"]) => category?.name || "—",
    },
    {
      key: "variants",
      label: "Price",
      render: (variants: DashboardProductListItem["variants"], product: DashboardProductListItem) => {
        // For simple products, show the direct price
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
        
        // For configurable products, show price range from variants
        if (!variants.length) return "—";
        const prices = variants.map((v) => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return renderPrice(minPrice);
        }
        return `${renderPrice(minPrice)} - ${renderPrice(maxPrice)}`;
      },
    },
    {
      key: "variants",
      label: "Stock",
      render: (variants: DashboardProductListItem["variants"], product: DashboardProductListItem) => {
        let totalStock = 0;
        
        if (product.productType === 'simple' && product.inStock !== null && product.inStock !== undefined) {
          totalStock = product.inStock;
        } else {
          totalStock = variants.reduce((sum, v) => sum + (v.inStock || 0), 0);
        }
        
        return (
          <Badge variant={totalStock > 0 ? "default" : "destructive"}>
            {totalStock}
          </Badge>
        );
      },
    },
    {
      key: "isPublished",
      label: "Status",
      render: (isPublished: boolean) =>
        renderBadge(
          isPublished ? "Published" : "Draft",
          isPublished ? "default" : "secondary"
        ),
    },
    {
      key: "updatedAt",
      label: "Updated",
      render: renderDate,
    },
  ];

  return (
    <DataTable
      data={data}
      columns={columns}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      emptyMessage="No products found. Create your first product to get started."
    />
  );
};

export default ProductsTableWrapper;
