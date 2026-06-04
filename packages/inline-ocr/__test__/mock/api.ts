import { vi } from 'vitest'

// Inline-ocr does not directly call API endpoints, but the alias is required
// by vitest.config.mts for workspace consistency.
export const clientApi = {
  api: {}
}
export const adminApi = {
  api: {}
}
export const globalApi = {
  api: {}
}
