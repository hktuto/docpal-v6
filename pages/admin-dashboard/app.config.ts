import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-dashboard":{
      id:"admin-dashboard",
      name: 'dashboardManage',
      label: "adminMenu.dashboard",
      icon: "carbon:dashboard",
      hoverIcon: "carbon:dashboard",
      component: "LazyDashboardManagePage",
      feature: "DASHBOARD",
      props:{},
    },
    "admin-work-panel":{
      id:"admin-work-panel",
      name: 'admin-work-panel',
      label: "adminMenu.workPanel",
      icon: "material-symbols:home",
      hoverIcon: "material-symbols:home",
      component: "LazyPersonalDashboardManagePage",
      feature: "DASHBOARD",
      handleError:true,
      props:{},
    }
  }
  

})
