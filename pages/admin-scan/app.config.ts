// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'admin-scan': {
      id: 'admin-scan',
      name: 'admin-scan',
      label: 'Project List',
      icon: 'lucide:file',
      hoverIcon: 'lucide:file',
      component: 'LazyScanPage',
      feature: 'CORE',
      props: {}
    }
  }
})
