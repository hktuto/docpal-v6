// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-dam":{
      id:"admin-dam",
      name: 'dam-file-conversion',
      label: "adminMenu.DAM",
      icon: "lucide:file-scan",
      hoverIcon: "lucide:file-scan",
      component: "LazyDamPage",
      feature: "DAM_FILE_CONVERTION",
      props:{},
    }
  },

})