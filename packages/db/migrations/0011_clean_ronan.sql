CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
ALTER TABLE "stories" DROP CONSTRAINT "stories_link_edition_unique";--> statement-breakpoint
CREATE INDEX "stories_title_trgm_idx" ON "stories" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "stories_summary_trgm_idx" ON "stories" USING gin ("summary" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_link_edition_slot_unique" UNIQUE("link","edition_date","edition_slot");