import { z } from 'zod'

export const MenuItemSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  label: z.string(),
  slug: z.string(),
  type: z.enum(['folder', 'table', 'view', 'dashboard']),
  itemId: z.string().optional(),
  description: z.string().optional(),
  children: z.array(MenuItemSchema).optional(),
  order: z.number().optional(),
  viewId: z.string().optional(),
  tableId: z.string().optional(),
  tableSlug: z.string().optional()
}))

export const WorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  menu: z.array(MenuItemSchema),
  workspaceUsers: z.array(z.string().uuid()).nullable(),
  createdBy: z.string().uuid().nullable(),
  updateToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type WorkspaceZodType = z.infer<typeof WorkspaceSchema>

