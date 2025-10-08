// src/components/dashboard/products/steps/ProductImagesStep.tsx
"use client";

import React, { forwardRef } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUpload, { type ImageUploadRef } from "@/components/dashboard/image-upload";
import { VariantData } from "@/lib/validations/product-form";
import { ImageUploadData } from "@/lib/validations/dashboard";

interface Color {
  id: string;
  name: string;
  hexCode: string;
}

interface Size {
  id: string;
  name: string;
}

interface ProductImagesStepProps {
  images: ImageUploadData[];
  variants: VariantData[];
  colors: Color[];
  sizes: Size[];
  onImagesChange: (images: ImageUploadData[]) => void;
  maxImages?: number;
}

const ProductImagesStep = forwardRef<ImageUploadRef, ProductImagesStepProps>(({
  images,
  variants,
  colors,
  sizes,
  onImagesChange,
  maxImages = 20,
}, ref) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Product Images & Media
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ImageUpload
          ref={ref}
          images={images}
          onChange={onImagesChange}
          maxImages={maxImages}
          variants={variants}
          colors={colors}
          sizes={sizes}
        />
      </CardContent>
    </Card>
  );
});

ProductImagesStep.displayName = 'ProductImagesStep';

export default ProductImagesStep;
