CREATE TYPE "public"."hero_link_type" AS ENUM('product', 'collection', 'external', 'none');--> statement-breakpoint
CREATE TYPE "public"."hero_media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "hero_slides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"desktop_media_type" "hero_media_type" NOT NULL,
	"desktop_media_url" text NOT NULL,
	"mobile_media_type" "hero_media_type" NOT NULL,
	"mobile_media_url" text NOT NULL,
	"link_type" "hero_link_type" DEFAULT 'none' NOT NULL,
	"linked_product_id" uuid,
	"linked_collection_id" uuid,
	"external_url" text,
	"alt_text" text,
	"description" text,
	"published_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "hero_slides" ADD CONSTRAINT "hero_slides_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hero_slides" ADD CONSTRAINT "hero_slides_linked_collection_id_collections_id_fk" FOREIGN KEY ("linked_collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;