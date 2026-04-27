import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  extends:[
  ],
  modules: [
    
  ],
  css: [
    join(currentDir, './assets/styles/component.scss') 
  ]
})
