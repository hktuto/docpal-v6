ALTER TABLE "case_fields" RENAME COLUMN "aggregation_field_name" TO "aggregationFieldName";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "aggregation_method" TO "aggregationMethod";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "business_type" TO "businessType";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "default_value" TO "defaultValue";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "display_structure" TO "displayStructure";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "field_length" TO "fieldLength";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "field_name" TO "fieldName";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "field_name_alias" TO "fieldNameAlias";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "field_type" TO "fieldType";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "formula_expression" TO "formulaExpression";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "is_array" TO "isArray";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "is_hidden" TO "isHidden";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "is_reference" TO "isReference";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "is_required" TO "isRequired";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "is_unique" TO "isUnique";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "master_table_id" TO "tableId";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "updated_by" TO "updatedBy";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "display_field_ids" TO "displayFieldIds";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "relation_field_id" TO "relationFieldId";--> statement-breakpoint
ALTER TABLE "case_fields" RENAME COLUMN "relation_table_id" TO "relationTableId";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "table_name" TO "tableName";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "entity_id" TO "entityId";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "form_structure" TO "formStructure";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "updated_by" TO "updatedBy";--> statement-breakpoint
ALTER TABLE "case_tables" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "entity_id" TO "entityId";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "item_type" TO "itemType";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "item_id" TO "itemId";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "parent_id" TO "parentId";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "updated_by" TO "updatedBy";--> statement-breakpoint
ALTER TABLE "case_tree" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "case_type" RENAME COLUMN "entity_type" TO "entityType";--> statement-breakpoint
ALTER TABLE "case_type" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "case_type" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "case_type" RENAME COLUMN "updated_by" TO "updatedBy";--> statement-breakpoint
ALTER TABLE "case_type" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "view_name" TO "viewName";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "table_id" TO "tableId";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "is_default" TO "isDefault";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "entity_id" TO "entityId";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "created_by" TO "createdBy";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "updated_by" TO "updatedBy";--> statement-breakpoint
ALTER TABLE "case_views" RENAME COLUMN "updated_at" TO "updatedAt";--> statement-breakpoint
ALTER TABLE "case_tables" DROP CONSTRAINT "case_tables_table_name_unique";--> statement-breakpoint
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_view_name_unique";--> statement-breakpoint
ALTER TABLE "case_fields" DROP CONSTRAINT "case_fields_master_table_id_case_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "case_fields" DROP CONSTRAINT "case_fields_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_fields" DROP CONSTRAINT "case_fields_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_fields" DROP CONSTRAINT "case_fields_relation_table_id_case_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tables" DROP CONSTRAINT "case_tables_entity_id_case_type_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tables" DROP CONSTRAINT "case_tables_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tables" DROP CONSTRAINT "case_tables_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tree" DROP CONSTRAINT "case_tree_entity_id_case_type_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tree" DROP CONSTRAINT "case_tree_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_tree" DROP CONSTRAINT "case_tree_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_type" DROP CONSTRAINT "case_type_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_type" DROP CONSTRAINT "case_type_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_table_id_case_tables_id_fk";
--> statement-breakpoint
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_entity_id_case_type_id_fk";
--> statement-breakpoint
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "case_views" DROP CONSTRAINT "case_views_updated_by_users_id_fk";
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
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_updatedBy_users_id_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_tables" ADD CONSTRAINT "case_tables_tableName_unique" UNIQUE("tableName");--> statement-breakpoint
ALTER TABLE "case_views" ADD CONSTRAINT "case_views_viewName_unique" UNIQUE("viewName");