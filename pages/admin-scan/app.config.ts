// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'admin-scan': {
      id: 'admin-scan',
      name: 'admin-scan',
      label: 'Project List',
      icon: 'lucide:scan-text',
      hoverIcon: 'lucide:scan-text',
      component: 'LazyScanProjectPage',
      feature: 'CORE',
      props: {}
    }
  }
})
