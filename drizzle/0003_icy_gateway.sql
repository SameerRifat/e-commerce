CREATE TABLE "size_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "size_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sizes" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "sizes" ADD CONSTRAINT "sizes_category_id_size_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."size_categories"("id") ON DELETE no action ON UPDATE no action;