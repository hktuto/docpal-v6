// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  runtimeConfig: {
    public: {
      HOCUSPOCUS_URL: process.env.HOCUSPOCUS_URL || 'ws://32.148.160.193:1234'
    }
  },
  extends:["../dp-mdTable"]
})
