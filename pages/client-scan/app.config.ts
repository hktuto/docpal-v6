// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'client-scan': {
      id: 'client-scan',
      name: 'client-scan',
      label: 'Batch List',
      icon: 'lucide:scan-line',
      hoverIcon: 'lucide:scan-line',
      component: 'LazyClientScanPage',
      feature: 'CORE',
      props: {}
    }
  }
})
