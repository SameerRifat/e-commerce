// src/components/dashboard/products/components/VariantCard.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VALIDATION_RULES } from "@/lib/validations/product-form";

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
  colorId: string;
  sizeId: string;
  inStock: number;
  weight?: number | null;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  } | null;
}

interface VariantCardProps {
  variant: Variant;
  index: number;
  colors: Color[];
  sizes: Size[];
  onUpdate: (index: number, field: string, value: string | number | null) => void;
  onRemove: (index: number) => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  index,
  colors,
  sizes,
  onUpdate,
  onRemove,
}) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <Badge variant="outline">Variant {index + 1}</Badge>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">Color *</label>
          <Select
            value={variant.colorId}
            onValueChange={(value) => onUpdate(index, 'colorId', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color.id} value={color.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.hexCode }}
                    />
                    {color.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Size *</label>
          <Select
            value={variant.sizeId}
            onValueChange={(value) => onUpdate(index, 'sizeId', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size.id} value={size.id}>
                  {size.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">SKU *</label>
          <Input
            className="mt-1"
            value={variant.sku}
            onChange={(e) => onUpdate(index, 'sku', e.target.value.toUpperCase())}
            placeholder="Auto-generated"
            maxLength={VALIDATION_RULES.variant.sku.maxLength}
            pattern="[A-Z0-9-]+"
            title="SKU can only contain uppercase letters, numbers, and hyphens"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {variant.sku.length}/{VALIDATION_RULES.variant.sku.maxLength}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Price *</label>
          <Input
            className="mt-1"
            type="number"
            step="0.01"
            min={VALIDATION_RULES.variant.price.min}
            max={VALIDATION_RULES.variant.price.max}
            value={variant.price}
            onChange={(e) => onUpdate(index, 'price', e.target.value)}
            placeholder="0.00"
          />
          <div className="text-xs text-muted-foreground mt-1">
            ${VALIDATION_RULES.variant.price.min} - ${VALIDATION_RULES.variant.price.max.toLocaleString()}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Sale Price</label>
          <Input
            className="mt-1"
            type="number"
            step="0.01"
            min={VALIDATION_RULES.variant.salePrice.min}
            max={VALIDATION_RULES.variant.salePrice.max}
            value={variant.salePrice || ""}
            onChange={(e) => onUpdate(index, 'salePrice', e.target.value || null)}
            placeholder="0.00"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Must be less than regular price
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Initial Stock</label>
          <Input
            className="mt-1"
            type="number"
            min={VALIDATION_RULES.variant.inStock.min}
            max={VALIDATION_RULES.variant.inStock.max}
            value={variant.inStock}
            onChange={(e) => onUpdate(index, 'inStock', parseInt(e.target.value) || 0)}
            placeholder="0"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Max: {VALIDATION_RULES.variant.inStock.max.toLocaleString()} units
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Weight (g)</label>
          <Input
            className="mt-1"
            type="number"
            step="0.1"
            min={VALIDATION_RULES.variant.weight.min}
            max={VALIDATION_RULES.variant.weight.max}
            value={variant.weight || ""}
            onChange={(e) => onUpdate(index, 'weight', parseFloat(e.target.value) || null)}
            placeholder="0.0"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {VALIDATION_RULES.variant.weight.min}g - {VALIDATION_RULES.variant.weight.max.toLocaleString()}g
          </div>
        </div>
      </div>
    </Card>
  );
};

export default VariantCard;
