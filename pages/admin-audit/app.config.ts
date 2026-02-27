// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-audit":{
      id:"admin-audit",
      name: 'admin-audit',
      label: "adminMenu.audit",
      icon: "dp-icon:slog",
      hoverIcon: "dp-icon:slog",
      component: "LazyAuditPage",
      feature: "AUDIT",
      props:{},
    }
  } ,

})
