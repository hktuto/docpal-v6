import { defineVitestConfig } from '@nuxt/test-utils/config'
import path from 'path'

export default defineVitestConfig({
  resolve: {
    alias: {
      api: path.resolve(__dirname, './__test__/mock/api'),
      '~': path.resolve(__dirname, './'),
      '@': path.resolve(__dirname, './')
    }
  },
  test: {
    setupFiles: ['./__test__/setup.ts', './__test__/mock/element-plus.ts'],
    environment: 'happy-dom',
    reporters: ['html', 'json'],
    outputFile: {
      html: '../../.vitest-reporter-html/html/inline-ocr/index.html',
      json: '../../.vitest-reporter-html/json/inline-ocr.json'
    },
    globals: true
  }
})
