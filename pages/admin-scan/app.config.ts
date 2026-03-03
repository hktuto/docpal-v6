// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "admin-scan": {
      id: "admin-scan",
      name: "admin-scan",
      label: "menu.admin-scan",
      icon: "lucide:file",
      hoverIcon: "lucide:file",
      component: "LazyScanPage",
      feature: "CORE",
      props: {},
    }
  },
})
