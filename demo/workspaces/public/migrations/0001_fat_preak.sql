CREATE INDEX "workspaces_name_idx" ON "workspaces" USING btree (LOWER("name"));--> statement-breakpoint
CREATE INDEX "workspaces_description_idx" ON "workspaces" USING btree (LOWER("description"));--> statement-breakpoint
CREATE INDEX "workspaces_slug_idx" ON "workspaces" USING btree (LOWER("slug"));--> statement-breakpoint
CREATE INDEX "workspaces_name_sort_idx" ON "workspaces" USING btree ("name");--> statement-breakpoint
CREATE INDEX "workspaces_name_slug_idx" ON "workspaces" USING btree ("name","slug");