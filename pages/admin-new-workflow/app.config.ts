// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu:{
    "admin-new-workflow-manage":{
      id:"admin-new-workflow-manage",
      name: 'admin-new-workflow-manage',
      label: "adminMenu.workflow",
      icon: "icon-park-outline:writing-fluently",
      hoverIcon: "icon-park-outline:writing-fluently",
      component: "LazyWorkflowManagePage",
      feature: "WORKFLOW",
      props:{},
    },
    "admin-new-workflow-edit-manage":{
      id:"admin-new-workflow-edit-manage",
      name: 'admin-new-workflow-edit-manage',
      label: "adminMenu.workflowEditor",
      icon: "dp-icon:flow-outline",
      hoverIcon: "dp-icon:flow-fill",
      component: "LazyWorkflowEditManagePage",
      feature: "WORKFLOW",
      props:{},
    }
  }
})