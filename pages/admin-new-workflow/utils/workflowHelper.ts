export const routeWorkflowManageEditor = function (params: any) {
  return {
    id: 'workflow-edit-' + new Date().getTime(),
    name: 'workflow-edit-' + params.id,
    icon: 'dp-icon:flow-outline',
    label: params.name,
    component: 'LazyWorkflowEditManageEditor',
    props: {
      id: params.id
    }
  } as TabItem
}
