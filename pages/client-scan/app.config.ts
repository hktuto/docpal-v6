// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'client-scan': {
      id: 'client-scan',
      name: 'client-scan',
      label: 'Batch List',
      icon: 'lucide:file',
      hoverIcon: 'lucide:file',
      component: 'LazyClientScanPage',
      feature: 'CORE',
      props: {}
    }
  }
})
