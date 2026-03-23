// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-03-23',
  devtools: { enabled: true },
  modules: [

  ],
  extends:[
    "../../packages/base",
    "../../packages/workflow",
    "../../packages/calendar",
    "../../packages/doc-template"
  ]
})
