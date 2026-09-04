// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "dynamic-db": {
      id: "dynamic-db",
      name: "dynamic-db",
      label: "dashboardType.database",
      icon: "icon-park-outline:database-forbid",
      hoverIcon: "icon-park-outline:database-forbid",
      component: "LazyDatabaseList",
      feature: "CORE",
      props: {},
    }
  },
})
