// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-user":{
      id:"admin-user",
      name: 'admin-user-list',
      label: "adminMenu.User",
      icon: "lucide:user",
      hoverIcon: "lucide:user",
      component: "LazyAdminUserList",
      feature: "CORE",
      props:{},

    },
    "admin-group":{
      id:"admin-group",
      name: 'admin-group-list',
      label: "adminMenu.group",
      icon: "mingcute:group-line",
      hoverIcon: "mingcute:group-line",
      component: "LazyGroupList",
      feature: "CORE",
      props:{},
    }
  }

})
