export const routeWorkflowDetail  = function(params: any){
  return {
    id: "workflow-detail-versions-" + new Date().getTime(),
    name: "workflow-detail-versions-" + params.id,
    icon: 'dp-icon:flow-outline',
    label: params.name,
    component: 'LazyWorkflowDetail',
    props: {
      detail: params,
      workflowType: params.workflowType || 'myTask',
    }
  } as TabItem
}

export const routeWorkflowPage  = function(params: any){
  return {
    id: "client-workflow",
    name: "client-workflow",
    icon: 'dp-icon:flow-outline',
    label: 'menus_workflow',
    component: 'LazyWorkflowPage',
    props: {
      workflowType: params.workflowType,
    }
  } as TabItem
}

export function newWorkflowStartPage(label: string, userTaskId:string, processKey:string, versionId:string) {
  return {
    id: "workflow-detail-versions-" + new Date().getTime(),
    name: "workflow-start-versions-" + userTaskId,
    icon: 'dp-icon:flow-outline',
    label: label,
    component: 'LazyWorkflowStartFullPageDead',
    props: {
      userTaskId,
      processKey,
      versionId,
    }
  }
}
