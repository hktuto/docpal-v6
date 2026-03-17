
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  extends:[
    "../base",
    "../calendar",
    "../workflow"
  ],
  modules: [
    
  ],
  build: {
    transpile: ['xlsx', 'jspdf-autotable']
  }
})
