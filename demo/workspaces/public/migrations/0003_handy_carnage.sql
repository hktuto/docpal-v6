ALTER TABLE "relation_suggestions" DROP CONSTRAINT "relation_suggestions_sourceTableId_case_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "relation_suggestions" DROP CONSTRAINT "relation_suggestions_sourceFieldId_case_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "relation_suggestions" DROP CONSTRAINT "relation_suggestions_targetTableId_case_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "relation_suggestions" DROP CONSTRAINT "relation_suggestions_targetFieldId_case_fields_id_fk";
--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_sourceTableId_case_tables_id_fk" FOREIGN KEY ("sourceTableId") REFERENCES "public"."case_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_sourceFieldId_case_fields_id_fk" FOREIGN KEY ("sourceFieldId") REFERENCES "public"."case_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_targetTableId_case_tables_id_fk" FOREIGN KEY ("targetTableId") REFERENCES "public"."case_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relation_suggestions" ADD CONSTRAINT "relation_suggestions_targetFieldId_case_fields_id_fk" FOREIGN KEY ("targetFieldId") REFERENCES "public"."case_fields"("id") ON DELETE cascade ON UPDATE no action;