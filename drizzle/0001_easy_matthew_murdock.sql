ALTER TABLE "product_variants" ALTER COLUMN "color_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "size_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" text DEFAULT 'simple' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "in_stock" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" real;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" jsonb;