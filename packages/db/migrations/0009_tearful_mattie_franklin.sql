CREATE TYPE "public"."edition_slot" AS ENUM('morning', 'afternoon');--> statement-breakpoint
ALTER TABLE "editions" ALTER COLUMN "slot" SET DEFAULT 'morning'::"public"."edition_slot";--> statement-breakpoint
ALTER TABLE "editions" ALTER COLUMN "slot" SET DATA TYPE "public"."edition_slot" USING "slot"::"public"."edition_slot";--> statement-breakpoint
ALTER TABLE "editions" ALTER COLUMN "built_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "edition_slot" SET DEFAULT 'morning'::"public"."edition_slot";--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "edition_slot" SET DATA TYPE "public"."edition_slot" USING "edition_slot"::"public"."edition_slot";