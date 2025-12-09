// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "database-management": {
      id: "database-management",
      name: "database-management",
      label: "menu.database-management",
      icon: "lucide:file",
      hoverIcon: "lucide:file",
      component: "LazyDatabaseManagementPage",
      feature: "CORE",
      props: {},
    }
  },
})
