CREATE TABLE "case_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregation_field_name" text,
	"aggregation_method" text,
	"business_type" text DEFAULT 'text' NOT NULL,
	"default_value" text,
	"display_structure" jsonb,
	"field_length" integer DEFAULT 0 NOT NULL,
	"field_name" text NOT NULL,
	"field_name_alias" text NOT NULL,
	"field_type" text DEFAULT 'text' NOT NULL,
	"formula_expression" text,
	"is_array" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"is_reference" boolean DEFAULT false,
	"is_required" boolean DEFAULT false NOT NULL,
	"is_unique" boolean DEFAULT false,
	"master_table_id" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"display_field_ids" uuid[] DEFAULT '{}' NOT NULL,
	"relation_field_id" uuid,
	"relation_table_id" uuid
);
--> statement-breakpoint
CREATE TABLE "case_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'A' NOT NULL,
	"description" text,
	"table_name" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"form_structure" jsonb,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_tables_table_name_unique" UNIQUE("table_name")
);
--> statement-breakpoint
CREATE TABLE "case_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_id" uuid,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"item_type" text DEFAULT 'folder' NOT NULL,
	"item_id" text,
	"parent_id" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"entity_type" text DEFAULT 'case' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"view_name" text NOT NULL,
	"filter" jsonb,
	"sorting" jsonb,
	"grouping" jsonb,
	"table_id" uuid NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"entity_id" uuid NOT NULL,
	"fields" uuid[] DEFAULT '{}' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_views_view_name_unique" UNIQUE("view_name")
);
--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_master_table_id_case_tables_id_fk" FOREIGN KEY ("master_table_id") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_relation_table_id_case_tables_id_fk" FOREIGN KEY ("relation_table_id") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_entity_id_case_type_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_entity_id_case_type_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type" ADD CONSTRAINT "case_type_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type" ADD CONSTRAINT "case_type_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_table_id_case_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_entity_id_case_type_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;