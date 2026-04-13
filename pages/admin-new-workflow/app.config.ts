// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-new-workflow-manage":{
      id:"admin-new-workflow-manage",
      name: 'admin-new-workflow-manage',
      label: "adminMenu.runningWorkflow",
      icon: "icon-park-outline:writing-fluently",
      hoverIcon: "icon-park-outline:writing-fluently",
      component: "LazyWorkflowManagePage",
      feature: "WORKFLOW",
      props:{},
    }
  }
})