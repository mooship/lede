ALTER TABLE "stories" DROP CONSTRAINT "stories_edition_date_editions_date_fk";
--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_edition_date_editions_date_fk" FOREIGN KEY ("edition_date") REFERENCES "public"."editions"("date") ON DELETE cascade ON UPDATE no action;