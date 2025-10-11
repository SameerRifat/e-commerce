// src/components/dashboard/products/steps/ProductPricingStep.tsx
"use client";

import React from "react";
import { Control } from "react-hook-form";
import { DollarSign, Package2, Scale, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { VALIDATION_RULES } from "@/lib/validations/product-form";

interface ProductPricingStepProps {
  control: Control<any>;
}

const ProductPricingStep: React.FC<ProductPricingStepProps> = ({ control }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={control}
              name="sku"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>SKU (Stock Keeping Unit) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., LIP-RED-001"
                      maxLength={VALIDATION_RULES.variant.sku.maxLength}
                      className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for inventory tracking
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="price"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Regular Price *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        className={`pl-10 ${fieldState.error && fieldState.isTouched ? "border-red-500" : ""}`}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <div className="hidden lg:block h-5"/>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="salePrice"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Sale Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        min="0"
                        className={`pl-10 ${fieldState.error && fieldState.isTouched ? "border-red-500" : ""}`}
                        {...field}
                        value={field.value || ""}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Optional discounted price (must be less than regular price)
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormField
              control={control}
              name="inStock"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Stock Quantity *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0"
                        type="number"
                        min="0"
                        className={`pl-10 ${fieldState.error && fieldState.isTouched ? "border-red-500" : ""}`}
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Available inventory count
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="weight"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Weight (grams)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0.0"
                        type="number"
                        step="0.1"
                        min="0"
                        className={`pl-10 ${fieldState.error && fieldState.isTouched ? "border-red-500" : ""}`}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || null)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Product weight for shipping calculations
                  </FormDescription>
                  {fieldState.error && fieldState.isTouched && (
                    <FormMessage />
                  )}
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Dimensions (cm)</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={control}
                  name="dimensions.length"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="L"
                          type="number"
                          step="0.1"
                          min="0"
                          className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      {fieldState.error && fieldState.isTouched && (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="dimensions.width"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="W"
                          type="number"
                          step="0.1"
                          min="0"
                          className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      {fieldState.error && fieldState.isTouched && (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="dimensions.height"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="H"
                          type="number"
                          step="0.1"
                          min="0"
                          className={fieldState.error && fieldState.isTouched ? "border-red-500" : ""}
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      {fieldState.error && fieldState.isTouched && (
                        <FormMessage />
                      )}
                    </FormItem>
                  )}
                />
              </div>
              <FormDescription>
                Length × Width × Height for shipping calculations
              </FormDescription>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductPricingStep;
