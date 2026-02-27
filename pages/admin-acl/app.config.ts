// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-acl":{
      id:"admin-acl",
      name: 'admin-acl',
      label: "adminMenu.ACL",
      icon: "dp-icon:acl",
      hoverIcon: "dp-icon:acl",
      component: "LazyAclPage",
      feature: "CORE",
      props:{},
    }
  },

})
