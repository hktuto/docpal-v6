import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  password: z.string(),
  isSuperAdmin: z.boolean(),
  emailVerifiedAt: z.date().nullable(),
  lastLoginAt: z.date().nullable(),
  updateToken: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserZodType = z.infer<typeof UserSchema>

