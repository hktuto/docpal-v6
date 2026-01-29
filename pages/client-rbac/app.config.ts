// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
   "RBAC-client-page":{
      id:"RBAC-client-pag",
      name: 'rgac-page',
      label: "ROLE-Page",
      icon: "lucide:file-cog",
      hoverIcon: "lucide:file-cog",
      component: "LazyRbacPage",
      feature: "CORE",
    },
  }
})
