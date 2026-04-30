import { pgTable, uuid, text, timestamp, jsonb, integer, boolean, unique, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { users } from "./user"

// Example schema: Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  icon: text('icon'),
  description: text('description'),
  menu: jsonb('menu').$type<MenuItem[]>().default([]).notNull(),
  workspaceUsers: uuid('workspace_users').array(), // reference all users in workspace for electric sql
  createdBy: uuid('created_by').references(() => users.id),
  updateToken: text('_update_token'), // Session token for filtering own changes in Electric sync
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Index on lowercase name for case-insensitive search
  nameIndex: index('workspaces_name_idx').on(sql`LOWER(${table.name})`),
  
  // Index on lowercase description for case-insensitive search
  descriptionIndex: index('workspaces_description_idx').on(sql`LOWER(${table.description})`),
  
  // Index on lowercase slug for case-insensitive search
  slugIndex: index('workspaces_slug_idx').on(sql`LOWER(${table.slug})`),
  
  // Regular index on name for sorting
  nameSortIndex: index('workspaces_name_sort_idx').on(table.name),
  
  // Composite index for common queries
  nameSlugIndex: index('workspaces_name_slug_idx').on(table.name, table.slug),
}))

export type WorkspaceType = typeof workspaces.$inferInsert


export type MenuItem = {
  id: string
  label: string
  slug: string
  type: 'folder' | 'table' | 'view' | 'dashboard'
  itemId?: string
  description?: string
  children?: MenuItem[]
  order?: number
  viewId?: string
  tableId?: string
  tableSlug?: string
}
