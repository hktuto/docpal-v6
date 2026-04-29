// https://nuxt.com/docs/api/configuration/nuxt-config
require('events').EventEmitter.defaultMaxListeners = 50
import { resolve } from 'path'
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: false,
  modules: [],
  extends: [
    '../../packages/icon',
    '../../packages/authApp',
    '../../packages/rbac',
    "../../packages/dp-scan",

    '../../pages/client-browse',
    '../../pages/client-search',
    '../../pages/client-master-table',
    '../../pages/client-folder-cabinet',
    // '../../pages/client-workflow',
    '../../pages/client-new-workflow',
    '../../packages/dp-dashboard',
    '../../pages/client-ai-upload',
    '../../pages/client-share',
    '../../pages/client-trash',
    '../../pages/client-home',
    '../../pages/client-file-policies',
    // '../../packages/dp-cmmn-x6',
    '../../pages/client-case-manage',
    '../../pages/client-easy-form',
    '../../pages/client-rbac',
    '../../pages/client-user-setting',
    "../../pages/client-scan",
    // '../../pages/admin-workflow-editor',
    '../../pages/admin-user',
    '../../pages/admin-acl',
    '../../pages/admin-setting',
    '../../pages/admin-audit',
    '../../pages/admin-azure',
    '../../pages/admin-masterTable',
    '../../pages/admin-easy-form',
    '../../pages/super-workflow-form',
    '../../pages/admin-dam',
    '../../pages/admin-document-template',
    // '../../pages/admin-docTemplate',
    '../../pages/admin-case-management',
    '../../pages/admin-file-policies',
    '../../pages/admin-docker-log',
    '../../pages/admin-message-queue',
    '../../pages/admin-share',
    '../../pages/admin-external-connection',
    // '../../pages/admin-workflow',
    '../../pages/admin-document-type',
    '../../pages/admin-new-workflow',
    '../../pages/admin-log-manage',
    '../../pages/admin-calendar-setting',
    '../../pages/admin-folder-cabinet',
    '../../pages/admin-email-template',
    '../../pages/admin-watermark',
    '../../pages/admin-message-template',
    '../../pages/admin-unique-id-generator',
    // "../../pages/admin-share",
    '../../pages/admin-rbac',
    '../../pages/admin-password-policy',
    '../../pages/admin-company-profile',
    '../../pages/admin-external-storage',
    '../../pages/admin-import-jobs',
    "../../pages/admin-scan",
    // public pages
    '../../pages/public-share',
    '../../pages/public-upload',
    '../../pages/public-easy-form',
    '../../packages/dp-contact',

    // demo packages
    // "../../demo/database",
    // "../../demo/workspaces"
  ],
  features: {
    inlineStyles: true
  },
  runtimeConfig: {
    public: {
      platform: 'client',
      /** 根应用显式声明，确保客户端 useRuntimeConfig() 能拿到（仅靠 layers 合并时可能缺失） */
      DOCPAL_GATEWAY_PROXY: process.env.DOCPAL_GATEWAY_PROXY,
      defaultTab: {
        id: 'client-work-panel',
        name: 'client-work-panel',
        label: 'adminMenu.workPanel',
        hoverIcon: 'material-symbols:dashboard-customize-outline-rounded',
        component: 'LazyHomePage',
        props: {}
      }
    }
  },
  alias: {
    '@packages': resolve(__dirname, '../../packages')
  }
})
