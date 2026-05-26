import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      api: path.resolve(__dirname, './__test__/mock/api.ts'),
      '#imports': path.resolve(__dirname, './__test__/mock/nuxt-imports.ts')
    }
  },
  test: {
    reporters: ['verbose'],
    globals: true
  }
})
