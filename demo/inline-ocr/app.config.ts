// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "inline-ocr": {
      id: "inline-ocr",
      name: "inline-ocr",
      label: "menu.inline-ocr",
      icon: "lucide:scan-text",
      hoverIcon: "lucide:scan-text",
      component: "LazyInlineOcrPage",
      feature: "CORE",
      props: {},
    }
  },
})
