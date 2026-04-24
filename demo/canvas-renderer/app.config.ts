// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "canvas-renderer": {
      id: "canvas-renderer",
      name: "canvas-renderer",
      label: "menu.canvas-renderer",
      icon: "lucide:file",
      hoverIcon: "lucide:file",
      component: "LazyCanvasRendererPage",
      feature: "CORE",
      props: {},
    }
  },
})
