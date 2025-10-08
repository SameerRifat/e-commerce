ALTER TYPE "public"."order_status" ADD VALUE 'processing' BEFORE 'paid';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'out_for_delivery' BEFORE 'delivered';