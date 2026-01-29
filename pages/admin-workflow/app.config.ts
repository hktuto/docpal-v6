// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-workflow-manage":{
      id:"admin-workflow-manage",
      name: 'admin-workflow-manage',
      label: "adminMenu.runningWorkflow",
      icon: "icon-park-outline:writing-fluently",
      hoverIcon: "icon-park-outline:writing-fluently",
      component: "LazyWorkflowManagePage",
      feature: "WORKFLOW",
      props:{},
    },
    "admin-workflow-retry":{
      id:"admin-workflow-retry",
      name: 'admin-workflow-retry',
      label: "adminMenu.WorkflowRetry",
      icon: "fluent:tray-item-add-24-regular",
      hoverIcon: "fluent:tray-item-add-24-regular",
      component: "LazyWorkflowRetryPage",
      feature: "WORKFLOW",
      props:{},
    }
  }

})