// src/app/dashboard/products/variants/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/page-header";
import DataTable, { Column, renderPrice, renderDate } from "@/components/dashboard/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Mock data for product variants
interface ProductVariant {
  id: string;
  sku: string;
  product: {
    id: string;
    name: string;
  };
  price: string;
  salePrice: string | null;
  color: {
    name: string;
    hexCode: string;
  };
  size: {
    name: string;
  };
  inStock: number;
  createdAt: Date;
}

const mockVariants: ProductVariant[] = [
  {
    id: "v1",
    sku: "GLM-LML-RR-STD",
    product: { id: "1", name: "Luxe Matte Lipstick" },
    price: "24.99",
    salePrice: "19.99",
    color: { name: "Ruby Red", hexCode: "#DC143C" },
    size: { name: "Standard" },
    inStock: 45,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "v2",
    sku: "GLM-LML-CP-STD",
    product: { id: "1", name: "Luxe Matte Lipstick" },
    price: "24.99",
    salePrice: null,
    color: { name: "Coral Pink", hexCode: "#FF7F7F" },
    size: { name: "Standard" },
    inStock: 32,
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "v3",
    sku: "PS-HFS-CLR-30ML",
    product: { id: "2", name: "Hydrating Face Serum" },
    price: "89.99",
    salePrice: null,
    color: { name: "Clear", hexCode: "#FFFFFF" },
    size: { name: "30ml" },
    inStock: 23,
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "v4",
    sku: "CP-ESP-MC-STD",
    product: { id: "3", name: "Eyeshadow Palette - Sunset Dreams" },
    price: "34.99",
    salePrice: null,
    color: { name: "Multicolor", hexCode: "#FF6B35" },
    size: { name: "Standard" },
    inStock: 12,
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "v5",
    sku: "GLM-LML-NB-STD",
    product: { id: "1", name: "Luxe Matte Lipstick" },
    price: "24.99",
    salePrice: "22.99",
    color: { name: "Nude Beige", hexCode: "#F5DEB3" },
    size: { name: "Standard" },
    inStock: 28,
    createdAt: new Date("2024-01-22"),
  },
];

const VariantsPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");

  // Filter variants based on search and filters
  const filteredVariants = useMemo(() => {
    return mockVariants.filter((variant) => {
      const matchesSearch =
        searchTerm === "" ||
        variant.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.color.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variant.size.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && variant.inStock > 0) ||
        (stockFilter === "low-stock" && variant.inStock > 0 && variant.inStock <= 10) ||
        (stockFilter === "out-of-stock" && variant.inStock === 0);

      return matchesSearch && matchesStock;
    });
  }, [searchTerm, stockFilter]);

  const handleEdit = (variant: ProductVariant) => {
    router.push(`/dashboard/products/${variant.product.id}/variants/${variant.id}/edit`);
  };

  const handleDelete = (variant: ProductVariant) => {
    console.log("Delete variant:", variant.id);
  };

  const handleView = (variant: ProductVariant) => {
    router.push(`/dashboard/products/${variant.product.id}/variants/${variant.id}`);
  };

  const columns: Column<ProductVariant>[] = [
    {
      key: "sku",
      label: "SKU",
      render: (sku: string) => (
        <span className="font-mono text-sm">{sku}</span>
      ),
    },
    {
      key: "product.name",
      label: "Product",
      render: (productName: string) => (
        <span className="font-medium">{productName}</span>
      ),
    },
    {
      key: "color",
      label: "Color",
      render: (color: ProductVariant["color"]) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: color.hexCode }}
          />
          <span className="text-sm">{color.name}</span>
        </div>
      ),
    },
    {
      key: "size.name",
      label: "Size",
      render: (sizeName: string) => (
        <Badge variant="outline">{sizeName}</Badge>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (price: string, variant: ProductVariant) => (
        <div className="flex items-center gap-2">
          {variant.salePrice && (
            <span className="text-sm text-gray-500 line-through">
              {renderPrice(price)}
            </span>
          )}
          <span className="font-semibold">
            {renderPrice(variant.salePrice || price)}
          </span>
        </div>
      ),
    },
    {
      key: "inStock",
      label: "Stock",
      render: (stock: number) => {
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        if (stock === 0) variant = "destructive";
        else if (stock <= 10) variant = "outline";
        
        return (
          <Badge variant={variant}>
            {stock}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      label: "Created",
      render: renderDate,
    },
  ];

  const totalVariants = filteredVariants.length;
  const totalStock = filteredVariants.reduce((sum, variant) => sum + variant.inStock, 0);
  const lowStockCount = filteredVariants.filter((v) => v.inStock > 0 && v.inStock <= 10).length;
  const outOfStockCount = filteredVariants.filter((v) => v.inStock === 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Variants"
        description="Manage color and size combinations for your products"
        action={{
          label: "Add Variant",
          onClick: () => router.push("/dashboard/products/new"),
          icon: <Plus className="h-4 w-4" />,
        }}
      >
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search variants by SKU, product, color, or size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Stock Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock (≤10)</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <DataTable
        data={filteredVariants}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        emptyMessage="No variants found. Create product variants to manage color and size combinations."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalVariants}
          </div>
          <div className="text-sm text-gray-600">Total Variants</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalStock}
          </div>
          <div className="text-sm text-gray-600">Total Stock</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {lowStockCount}
          </div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {outOfStockCount}
          </div>
          <div className="text-sm text-gray-600">Out of Stock</div>
        </div>
      </div>
    </div>
  );
};

export default VariantsPage;
