// https://nuxt.com/docs/api/configuration/nuxt-config

import { defineNuxtConfig } from "nuxt/config";

console.log(process.env.CLIENT_PROXY)
export default defineNuxtConfig({
  ssr:false,
  extends:[
    "../",
    "../../../packages/authApp",
  ],
  nitro:{
    devProxy:{
      '/api':{
        target: process.env.ADMIN_PROXY,
        changeOrigin: true,
        prependPath: true
      },
    }
  }
  
})