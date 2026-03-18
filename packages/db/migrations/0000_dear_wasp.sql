CREATE TABLE "editions" (
	"date" date PRIMARY KEY NOT NULL,
	"built_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_date" date NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"category" text NOT NULL,
	"link" text NOT NULL,
	"pub_date" text,
	"source" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_edition_date_editions_date_fk" FOREIGN KEY ("edition_date") REFERENCES "public"."editions"("date") ON DELETE no action ON UPDATE no action;