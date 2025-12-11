ALTER TABLE "video_carousel_items" DROP CONSTRAINT "video_carousel_items_linked_collection_id_collections_id_fk";
--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP CONSTRAINT "video_carousel_items_linked_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "video_carousel_items" ALTER COLUMN "linked_product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "video_carousel_items" ADD CONSTRAINT "video_carousel_items_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "link_type";--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "linked_collection_id";--> statement-breakpoint
ALTER TABLE "video_carousel_items" DROP COLUMN "external_url";--> statement-breakpoint
DROP TYPE "public"."video_carousel_link_type";