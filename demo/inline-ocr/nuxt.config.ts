// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [],
  extends: [
    "../../packages/base"
  ],
  vite: {
    optimizeDeps: {
      include: [
        'clipper-lib',
        '@techstark/opencv-js',
      ],
      exclude: [
        '@paddleocr/paddleocr-js',
        'onnxruntime-web'
      ]
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true
      }
    }
  }
})
