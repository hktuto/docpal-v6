// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  vite: {
    optimizeDeps: {
      // Exclude PGlite packages from optimization (they contain WASM files)
      exclude: [
        '@electric-sql/pglite'
      ],

    }
  }
})
