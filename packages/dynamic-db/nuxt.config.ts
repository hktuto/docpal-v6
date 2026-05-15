// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    public: {
      HOCUSPOCUS_URL: process.env.HOCUSPOCUS_URL || 'ws://localhost:1234'
    }
  },
  extends:["../dp-mdTable"]
})
