// src/components/dashboard/products/steps/ProductVariantsStep.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { DollarSign, Plus, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import VariantFormCard from "../components/VariantFormCard";

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

interface ProductVariantsStepProps {
  control: Control<any>;
  variants: Variant[];
  colors: Color[];
  sizes: Size[];
  onAddVariant: () => void;
  onRemoveVariant: (index: number) => void;
}

const ProductVariantsStep: React.FC<ProductVariantsStepProps> = ({
  control,
  variants,
  colors,
  sizes,
  onAddVariant,
  onRemoveVariant,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Product Variants & Pricing
          </div>
          <Button type="button" onClick={onAddVariant} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Variant
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={control}
          name="variants"
          render={() => (
            <FormItem>
              {variants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No variants created yet</p>
                  <p className="text-sm">Add your first variant to define colors, sizes, and pricing</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, index) => (
                    <VariantFormCard
                      key={variant.id || index}
                      control={control}
                      index={index}
                      colors={colors}
                      sizes={sizes}
                      onRemove={onRemoveVariant}
                    />
                  ))}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default ProductVariantsStep;
