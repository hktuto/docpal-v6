// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    "client-easy-form":{
      id:"client-easy-form",
      name: 'client-easy-form',
      label: "adminMenu.easyForm",
      icon: "material-symbols-light:table-edit-rounded",
      hoverIcon: "material-symbols-light:table-edit-rounded",
      component: "LazyEasyFormPage",
      feature: "WORKFLOW",
      props:{},
    }
  } ,

})