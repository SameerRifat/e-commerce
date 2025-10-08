// src/components/dashboard/products/steps/ProductInventoryStep.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { Warehouse } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface Size {
  id: string;
  name: string;
}

interface Variant {
  id?: string;
  sku: string;
  price: string;
  salePrice?: string | null;
  colorId?: string | null;
  sizeId?: string | null;
  inStock: number;
  weight?: number | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  } | null;
}

interface ProductInventoryStepProps {
  control: Control<any>;
  variants: Variant[];
  colors: Color[];
  sizes: Size[];
}

const ProductInventoryStep: React.FC<ProductInventoryStepProps> = ({
  control,
  variants,
  colors,
  sizes,
}) => {
  const totalVariants = variants.length;
  const inStockVariants = variants.filter(v => v.inStock > 0).length;
  const totalStock = variants.reduce((sum, v) => sum + (v.inStock || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Inventory Review
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Review your product variants and inventory levels before publishing
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalVariants}</div>
              <div className="text-sm text-muted-foreground">Total Variants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{inStockVariants}</div>
              <div className="text-sm text-muted-foreground">In Stock</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalStock}</div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
          </div>

          {/* Variant Overview */}
          <div className="space-y-4">
            <h4 className="font-medium">Variant Overview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variants.map((variant, index) => {
                const color = colors.find(c => c.id === variant.colorId);
                const size = sizes.find(s => s.id === variant.sizeId);
                
                return (
                  <Card key={variant.id || index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        {color && (
                          <div
                            className="w-4 h-4 rounded border"
                            style={{ backgroundColor: color.hexCode }}
                          />
                        )}
                        <span className="font-medium text-sm">
                          {color?.name || "No Color"}
                          {color && size ? " - " : ""}
                          {size?.name || ""}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div>SKU: {variant.sku}</div>
                        <div>Price: ${variant.price}</div>
                        {variant.salePrice && <div>Sale: ${variant.salePrice}</div>}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{variant.inStock || 0} units</span>
                        <Badge variant={variant.inStock > 0 ? "default" : "secondary"} className="text-xs">
                          {variant.inStock > 0 ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Warnings */}
          {inStockVariants === 0 && (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Warehouse className="h-4 w-4" />
                <span className="font-medium">Inventory Warning</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                All variants are out of stock. Consider adding inventory before publishing the product.
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            This is a summary view. To modify stock quantities, go back to the Variants & Pricing step.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInventoryStep;
