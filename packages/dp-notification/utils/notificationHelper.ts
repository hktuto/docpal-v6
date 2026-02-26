import { newClientApi } from 'api'
import { caseManageDashboardPage, routeCalendarManagement } from '#imports'
import { needDocHelper, openDocHelper } from './notificationDocHelper'
export function notiShowView(row: any) {
  if ('Workflow' === row.type && '' !== row.content?.message) {
    try {
      const message = JSON.parse(row.content?.message)
      if (!!message.additionalContent) {
        return true
      }
    } catch (e) {}
  }

  const isCancel = ['TRASH', 'DELETE', 'CANCELD'].includes(row.operate) || (row.type === 'Upload-Request' && !row.content.processInstanceId)
  const showView = row.content.documentId || row.content.uploadId || row.content.processInstanceId
  return !isCancel && showView
}
export async function notiHandleView(row: any, tabProvider: any) {
  if (needDocHelper(row, tabProvider)) {
    return
  }
  if (row.content.processInstanceId && !row.content?.processDefinitionId?.includes('adhocApproval')) {
    if (row.type === 'Upload-Request') {
      // router.push(`/fileRequest/${row.content.processInstanceId}`)
      const newItem = createUploadRequestDetailParams({
        taskId: row.content.processInstanceId
      })
      tabProvider?.openTab(newItem, true)
    } else {
      const newItem = await getWorkflowRoute(row.content.processInstanceId)
      if (!!newItem) tabProvider?.openTab(newItem, true)
    }
  } else if (row.content.documentId) {
    openDocHelper(row, tabProvider)
  } else if (row.content.caseInstanceId) {
    // TODO: get case instance
    const caseInstance = await newClientApi.getCaseInstanceCaseidCaseid(row.content.caseInstanceId).then((res) => res.data)
    const newItem = caseManageDashboardPage({
      instanceId: row.content.caseInstanceId,
      versionId: caseInstance?.cmmnVersionId
    })
    tabProvider?.openTab(newItem, true)
  } else if (row.content.uploadId) {
    const status = row.content.notiStatus === 'FAIL' ? 'Error' : 'Ready'
    // router.push(`/AIUpload/${row.content.uploadId}?status=${status}`)
    const newItem = createAiUploadDetail({
      id: row.content.uploadId,
      status
    })
    tabProvider?.openTab(newItem, true)
  }

  // workflow message
  else if (row.content.message && 'Workflow' === row.type) {
    const event = JSON.parse(row.content.message)
    // TODO：You need to jump to a different page according to the type of workflow message
    const eventType = event.eventType
    let newItem: TabItem
    switch (eventType) {
      case 'calendar':
        newItem = routeCalendarManagement(event.processInstanceId, 'calendar')
        tabProvider?.openTab(newItem, true)
        break
      case 'caseDashboard':
        try {
          const caseInstance = await newClientApi.getCaseInstanceCaseidCaseid(event.additionalContent).then((res) => res.data)
          const data = {
            instanceId: event.additionalContent,
            versionId: caseInstance.cmmnVersionId
          }
          newItem = caseManageDashboardPage(data)
          tabProvider?.openTab(newItem, true)
        } catch (e) {
          return
        }
        break
      default:
        break
    }
  }
}

export const getWorkflowRoute = async (processInstanceId: string) => {
  try {
    const taskList: any = await newClientApi.getDocpalWorkflowTasks({ processInstanceId }).then((res) => res.data)
    let newTab = {}
    if (taskList && taskList.length > 0) {
      newTab = routeWorkflowDetail({
        id: taskList[0].id,
        name: taskList[0].name
      })
    } else {
      newTab = routeWorkflowDetail({
        id: processInstanceId,
        name: 'completeTask',
        workflowType: 'completeTask'
      })
    }
    return newTab
  } catch (error) {
    return null
  }
}

export const getCaseRecord = async (id: string) => {
  try {
    let newTab = {}
    if (!id) {
      // TODO 因爲AddCaseDialog需要caseDetail.caseDefinitionKey與caseDetail.productionVersionId。無法在caseDetail中取到。
      // TODO 需要在AddCaseDialog頁面補充接口獲取這兩個數據
      newTab = caseManageDetailPage({
        name: 'case',
        id: id,
        data: {}
      })
    } else {
      newTab = caseManagePage()
    }
    return newTab
  } catch (e) {
    return null
  }
}
