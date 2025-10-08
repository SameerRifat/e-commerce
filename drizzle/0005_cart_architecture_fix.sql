-- Migration to fix cart architecture for both simple and configurable products
-- This migration adds support for direct product references in cart items

-- Add new columns to cart_items table
ALTER TABLE "cart_items" 
ADD COLUMN "product_id" uuid REFERENCES "products"("id") ON DELETE CASCADE,
ADD COLUMN "is_simple_product" boolean DEFAULT false NOT NULL;

-- Update the constraint to allow either product_id or product_variant_id (but not both)
ALTER TABLE "cart_items" 
ADD CONSTRAINT "cart_items_product_or_variant_check" 
CHECK (
  (product_id IS NOT NULL AND product_variant_id IS NULL AND is_simple_product = true) OR
  (product_id IS NULL AND product_variant_id IS NOT NULL AND is_simple_product = false)
);

-- Make product_variant_id nullable since simple products won't have variants
ALTER TABLE "cart_items" 
ALTER COLUMN "product_variant_id" DROP NOT NULL;

-- Add index for performance
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");
CREATE INDEX "cart_items_is_simple_product_idx" ON "cart_items"("is_simple_product");
