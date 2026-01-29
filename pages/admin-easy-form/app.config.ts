// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "admin-easy-form":{
      id:"admin-easy-form",
      name: 'admin-easy-form',
      label: "adminMenu.easyForm",
      icon: "material-symbols-light:table-edit-rounded",
      hoverIcon: "material-symbols-light:table-edit-rounded",
      component: "LazyAdminEasyFormPage",
      feature: "WORKFLOW",
      props:{},
    }
  } ,

})
