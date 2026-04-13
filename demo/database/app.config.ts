// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "admin-database-list": {
      id: "admin-database-list",
      name: "admin-database-list",
      label: "Database Management",
      icon: "icon-park-outline:database-forbid",
      hoverIcon: "icon-park-outline:database-forbid",
      component: "DatabasePage",
      feature: "CORE",
      props: {},
    }
  },
})
