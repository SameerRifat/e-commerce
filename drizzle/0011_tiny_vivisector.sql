ALTER TABLE "collections" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "is_published" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "collection_type" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "automation_rules" jsonb;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "collections" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_collections" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "product_collections" ADD COLUMN "added_at" timestamp DEFAULT now() NOT NULL;