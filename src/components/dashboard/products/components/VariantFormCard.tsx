// src/components/dashboard/products/components/VariantFormCard.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

interface VariantFormCardProps {
  control: Control<any>;
  index: number;
  colors: Color[];
  sizes: Size[];
  onRemove: (index: number) => void;
  showColors?: boolean;
  showSizes?: boolean;
}

const VariantFormCard: React.FC<VariantFormCardProps> = ({
  control,
  index,
  colors,
  sizes,
  onRemove,
  showColors = true,
  showSizes = true,
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
        {/* Color Selection */}
        {showColors && (
          <FormField
            control={control}
            name={`variants.${index}.colorId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Size Selection */}
        {showSizes && (
          <FormField
            control={control}
            name={`variants.${index}.sizeId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size.id} value={size.id}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SKU */}
        <FormField
          control={control}
          name={`variants.${index}.sku`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  placeholder="Auto-generated"
                  maxLength={VALIDATION_RULES.variant.sku.maxLength}
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                {field.value?.length || 0}/{VALIDATION_RULES.variant.sku.maxLength}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Price */}
        <FormField
          control={control}
          name={`variants.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="0.01"
                  min={VALIDATION_RULES.variant.price.min}
                  max={VALIDATION_RULES.variant.price.max}
                  placeholder="0.00"
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                ${VALIDATION_RULES.variant.price.min} - ${VALIDATION_RULES.variant.price.max.toLocaleString()}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sale Price */}
        <FormField
          control={control}
          name={`variants.${index}.salePrice`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sale Price</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  type="number"
                  step="0.01"
                  min={VALIDATION_RULES.variant.salePrice.min}
                  max={VALIDATION_RULES.variant.salePrice.max}
                  placeholder="0.00"
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                Must be less than regular price
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Initial Stock */}
        <FormField
          control={control}
          name={`variants.${index}.inStock`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Initial Stock</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || 0}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  type="number"
                  min={VALIDATION_RULES.variant.inStock.min}
                  max={VALIDATION_RULES.variant.inStock.max}
                  placeholder="0"
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                Max: {VALIDATION_RULES.variant.inStock.max.toLocaleString()} units
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Weight */}
        <FormField
          control={control}
          name={`variants.${index}.weight`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (g)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                  type="number"
                  step="0.1"
                  min={VALIDATION_RULES.variant.weight.min}
                  max={VALIDATION_RULES.variant.weight.max}
                  placeholder="0.0"
                />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                {VALIDATION_RULES.variant.weight.min}g - {VALIDATION_RULES.variant.weight.max.toLocaleString()}g
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Card>
  );
};

export default VariantFormCard;
