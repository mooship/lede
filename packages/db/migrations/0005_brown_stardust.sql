-- Drop FK referencing editions.date before touching the PK
ALTER TABLE "stories" DROP CONSTRAINT "stories_edition_date_editions_date_fk";--> statement-breakpoint
DROP INDEX "stories_edition_date_idx";--> statement-breakpoint
-- Drop old single-column PK (now safe)
ALTER TABLE "editions" DROP CONSTRAINT "editions_pkey";--> statement-breakpoint
-- Add slot columns
ALTER TABLE "editions" ADD COLUMN "slot" text DEFAULT 'morning' NOT NULL;--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "edition_slot" text DEFAULT 'morning' NOT NULL;--> statement-breakpoint
-- Create composite PK and FK
ALTER TABLE "editions" ADD CONSTRAINT "editions_pkey" PRIMARY KEY("date","slot");--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_edition_date_edition_slot_editions_date_slot_fk" FOREIGN KEY ("edition_date","edition_slot") REFERENCES "public"."editions"("date","slot") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stories_edition_date_slot_idx" ON "stories" USING btree ("edition_date","edition_slot");
