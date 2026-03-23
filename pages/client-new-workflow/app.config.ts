export default defineAppConfig({
  menu: {
    'client-new-workflow': {
      id: 'client-new-workflow',
      name: 'client-new-workflow',
      icon: 'dp-icon:flow-outline',
      hoverIcon: 'dp-icon:flow-outline',
      label: 'menus_workflow',
      component: 'LazyWorkflowPage',
      feature: 'WORKFLOW',
      props: {
        pageSize: 20,
        pageNum: 0
      }
    }
  }
})
