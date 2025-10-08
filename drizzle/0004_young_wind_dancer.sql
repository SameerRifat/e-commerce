ALTER TABLE "addresses" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."address_type";--> statement-breakpoint
CREATE TYPE "public"."address_type" AS ENUM('shipping', 'billing');--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "type" SET DATA TYPE "public"."address_type" USING "type"::"public"."address_type";--> statement-breakpoint
ALTER TABLE "addresses" ALTER COLUMN "country" SET DEFAULT 'Pakistan';--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "city_id" integer;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "state_id" integer;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "country_code" text DEFAULT 'PK' NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "country_id" integer DEFAULT 167 NOT NULL;--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "phone" text;