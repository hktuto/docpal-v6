// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const currentDir = dirname(fileURLToPath(import.meta.url))

const config = {
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,
  },
  modules: [
    '@nuxtjs/i18n',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt'
  ],
  css:[
    '../assets/styles/main.scss'
  ],
  extends:[
    "../sql-store"
  ],

  runtimeConfig:{
    public:{
      isProduction: process.env.NODE_ENV === 'production',
      pdfReaderUrl: process.env.pdfReaderUrl,
      NODE_ENV: process.env.NODE_ENV,
      CLIENT_PROXY: process.env.CLIENT_PROXY,
      ADMIN_PROXY: process.env.ADMIN_PROXY,
      PROXY: process.env.PROXY,
      DASHBOARD_PROXY: process.env.DASHBOARD_PROXY,
      DOCPAL_GATEWAY_PROXY: process.env.DOCPAL_GATEWAY_PROXY,
      OFFICE_END_POINT: process.env.OFFICE_END_POINT,
      UPLOAD_END_POINT: process.env.UPLOAD_END_POINT,
      ADMIN_END_POINT: process.env.ADMIN_END_POINT,
    }
  },
  i18n: {
    defaultLocale:'en-US',
    langDir:'lang',
    locales: [
      {
        code:'en-US',
        files: []
      },
      {
        code:'zh-CN',
        files: []
      },
      {
        code : 'zh-HK',
        files: []
      }
    ],
    strategy:'no_prefix',
    lazy: false,
    // detectBrowserLanguage: {
    //   useCookie: true,
    //   cookieKey: 'i18n_redirected',
    //   redirectOn: 'root' // recommended
    // }
  },
  nitro:{
    // routeRules:{
    //   '/adminApi/api': {proxy: {to: process.env.ADMIN_PROXY+"/**"}},
    //   '/public-api/report/v1/api': {proxy: {to: process.env.DASHBOARD_PROXY}},
    //   '/api/**': {proxy: {to: process.env.PROXY +"/**"}},
    //   '/notification/api/**': {proxy: {to: process.env.NOTIFICATION_PROXY+"/**"}},
    //   '/dashboard/**': {proxy: {to:process.env.DASHBOARD_PROXY+"/**"}},
    //   '/client/**': {proxy: {to:process.env.CLIENT_PROXY+"/**"}},
    // },

      devProxy:{
        '/admin/api':{
          target: process.env.ADMIN_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/adminApi/api':{
          target: process.env.ADMIN_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/public-api/report/v1/api':{
          target: process.env.DASHBOARD_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/api':{
          target: process.env.PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/docpalApi':{
          target: process.env.PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/dashboard':{
          target: process.env.DASHBOARD_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/client':{
          target: process.env.CLIENT_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/open-api/template':{
          target: process.env.OPEN_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
        '/gateway':{
          target: process.env.DOCPAL_GATEWAY_PROXY,
          changeOrigin: true,
          prependPath: true,
          headers: {
            'accept-encoding': 'identity'
          }
        },
      }
      // routeRules: {
      //     '/dashboard/**': {
      //         proxy: 'https://app4.wclsolution.com/public-api/report/v1/api/**'
      //     }
      // }
  },
  experimental: { appManifest: false },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
          quietDeps: true,
        },
      },
    },
    esbuild: {
      drop: ['debugger'],
      pure: ['console.error', 'console.warn', 'console.debug', 'console.trace'],
    },
    vue: {
      features: {
        propsDestructure: true,
      },
      script:{
        defineModel:true
      },
    }
  },
} as any


export default defineNuxtConfig(config)
