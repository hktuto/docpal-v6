CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"avatar" text,
	"password" text NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp,
	"last_login_at" timestamp,
	"_update_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon" text,
	"description" text,
	"menu" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"workspace_users" uuid[],
	"created_by" uuid,
	"_update_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_table_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_table_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"label" text NOT NULL,
	"type" integer NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"config" jsonb,
	"validation_rules" jsonb,
	"created_by" uuid,
	"_update_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"table_name" text NOT NULL,
	"workspace_id" uuid NOT NULL,
	"description" text,
	"icon" text,
	"form_json" jsonb,
	"card_json" jsonb,
	"detail_json" jsonb,
	"list_json" jsonb,
	"created_by" uuid,
	"_update_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "data_tables_table_name_unique" UNIQUE("table_name"),
	CONSTRAINT "data_tables_workspace_slug_unique" UNIQUE("workspace_id","slug")
);
--> statement-breakpoint
CREATE TABLE "table_migrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_table_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"migration_sql" text NOT NULL,
	"rollback_sql" text,
	"description" text,
	"created_by" uuid,
	"_update_token" text,
	"executed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_table_columns" ADD CONSTRAINT "data_table_columns_data_table_id_data_tables_id_fk" FOREIGN KEY ("data_table_id") REFERENCES "public"."data_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_table_columns" ADD CONSTRAINT "data_table_columns_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_table_columns" ADD CONSTRAINT "data_table_columns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_tables" ADD CONSTRAINT "data_tables_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_tables" ADD CONSTRAINT "data_tables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_migrations" ADD CONSTRAINT "table_migrations_data_table_id_data_tables_id_fk" FOREIGN KEY ("data_table_id") REFERENCES "public"."data_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_migrations" ADD CONSTRAINT "table_migrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspaces_name_idx" ON "workspaces" USING btree (LOWER("name"));--> statement-breakpoint
CREATE INDEX "workspaces_description_idx" ON "workspaces" USING btree (LOWER("description"));--> statement-breakpoint
CREATE INDEX "workspaces_slug_idx" ON "workspaces" USING btree (LOWER("slug"));--> statement-breakpoint
CREATE INDEX "workspaces_name_sort_idx" ON "workspaces" USING btree ("name");--> statement-breakpoint
CREATE INDEX "workspaces_name_slug_idx" ON "workspaces" USING btree ("name","slug");