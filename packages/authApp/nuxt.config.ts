// https://nuxt.com/docs/api/configuration/nuxt-
const config = {
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [],
  extends: ['../base', '../../pages/client-user-setting', '../../pages/admin-setting'],
  runtimeConfig: {
    public: {
      needAuth: true,
      updateInterval: 1000,
      endPoint: {
        clientUrl: process.env.CLIENTURL,
        admin: process.env.ADMIN_END_POINT,
        office: process.env.OFFICE_END_POINT,
        dashboard: process.env.DASHBOARD_PROXY,
        upload: process.env.UPLOAD_PROXY
      },
      // TODO: Obtained from the request header when logging in
      serverName: 'docpal-api',
      serverKey: '14ecdf56081AGSDghw',
      xApiKey: 'bf77bd45b0a82691b911054d2f9ca50d3b70dc964782b419456e7fdd9ddc0a5ca19b0638d42662a0e22c4734ce8d787c',
      xTenantId: 'demo'
    }
  },
  experimental: {
    appManifest: true,
    checkOutdatedBuildInterval: 300000
  }
} as any
if (process.env.NODE_ENV === 'development') {
  // TODO : remove this park in production
}
config.extends.push('../dp-language')

export default defineNuxtConfig(config)
