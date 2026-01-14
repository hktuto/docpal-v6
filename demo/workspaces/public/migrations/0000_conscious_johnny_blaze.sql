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
CREATE TABLE "case_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregationFieldName" text,
	"aggregationMethod" text,
	"businessType" text DEFAULT 'text' NOT NULL,
	"defaultValue" text,
	"displayStructure" jsonb,
	"fieldLength" integer DEFAULT 0 NOT NULL,
	"fieldName" text NOT NULL,
	"fieldNameAlias" text NOT NULL,
	"fieldType" text DEFAULT 'text' NOT NULL,
	"formulaExpression" text,
	"isArray" boolean DEFAULT false NOT NULL,
	"isHidden" boolean DEFAULT false NOT NULL,
	"isReference" boolean DEFAULT false,
	"isRequired" boolean DEFAULT false NOT NULL,
	"isUnique" boolean DEFAULT false,
	"tableId" uuid,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"displayFieldIds" uuid[] DEFAULT '{}' NOT NULL,
	"relationFieldId" uuid,
	"relationTableId" uuid
);
--> statement-breakpoint
CREATE TABLE "case_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'A' NOT NULL,
	"description" text,
	"tableName" text NOT NULL,
	"viewName" uuid,
	"entityId" uuid NOT NULL,
	"formStructure" jsonb,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_tables_tableName_unique" UNIQUE("tableName")
);
--> statement-breakpoint
CREATE TABLE "case_tree" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entityId" uuid,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"itemType" text DEFAULT 'folder' NOT NULL,
	"itemId" text,
	"parentId" uuid,
	"order" integer DEFAULT 0 NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_type" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"entityType" text DEFAULT 'case' NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"viewName" text NOT NULL,
	"filter" jsonb,
	"sorting" jsonb,
	"grouping" jsonb,
	"tableId" uuid NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"entityId" uuid NOT NULL,
	"fields" text[] DEFAULT '{}' NOT NULL,
	"createdBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedBy" uuid,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "case_views_viewName_unique" UNIQUE("viewName")
);
--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_tableId_case_tables_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_fields" ADD CONSTRAINT "case_fields_relationTableId_case_tables_id_fk" FOREIGN KEY ("relationTableId") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_entityId_case_type_id_fk" FOREIGN KEY ("entityId") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_entityId_case_type_id_fk" FOREIGN KEY ("entityId") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tree" ADD CONSTRAINT "case_tree_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type" ADD CONSTRAINT "case_type_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_type" ADD CONSTRAINT "case_type_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_tableId_case_tables_id_fk" FOREIGN KEY ("tableId") REFERENCES "public"."case_tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_entityId_case_type_id_fk" FOREIGN KEY ("entityId") REFERENCES "public"."case_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;