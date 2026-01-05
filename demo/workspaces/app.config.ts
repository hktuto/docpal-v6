// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "demo-workspaces": {
      id: "demo-workspaces",
      name: "demo-workspaces",
      label: "Demo Workspaces",
      icon: "icon-park-outline:database-forbid",
      hoverIcon: "icon-park-outline:database-forbid",
      component: "LazyDemoWorkspaceslist",
      feature: "CORE",
      props: {},
    }
  },
})
