CREATE TABLE "relation_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceTableId" uuid NOT NULL,
	"sourceFieldId" uuid NOT NULL,
	"targetTableId" uuid NOT NULL,
	"targetFieldId" uuid NOT NULL,
	"matchReason" text NOT NULL,
	"matchCount" integer NOT NULL,
	"totalCount" integer NOT NULL,
	"sampleValues" text[] DEFAULT '{}' NOT NULL,
	"suggestedType" text DEFAULT 'multiple' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_sourceTableId_case_tables_id_fk" FOREIGN KEY ("sourceTableId") REFERENCES "public"."case_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_sourceFieldId_case_fields_id_fk" FOREIGN KEY ("sourceFieldId") REFERENCES "public"."case_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_targetTableId_case_tables_id_fk" FOREIGN KEY ("targetTableId") REFERENCES "public"."case_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_targetFieldId_case_fields_id_fk" FOREIGN KEY ("targetFieldId") REFERENCES "public"."case_fields"("id") ON DELETE cascade ON UPDATE no action;
