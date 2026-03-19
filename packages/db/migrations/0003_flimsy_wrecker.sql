CREATE INDEX "stories_edition_date_idx" ON "stories" USING btree ("edition_date");--> statement-breakpoint
CREATE INDEX "stories_category_idx" ON "stories" USING btree ("category");--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_link_unique" UNIQUE("link");