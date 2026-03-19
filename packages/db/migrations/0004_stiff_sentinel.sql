ALTER TABLE "stories" DROP CONSTRAINT "stories_link_unique";--> statement-breakpoint
ALTER TABLE "editions" ADD COLUMN "feed_stats" text;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_link_edition_unique" UNIQUE("link","edition_date");