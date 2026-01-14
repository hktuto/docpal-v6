import { useState, createError } from '#imports'
import { useWorkspaces } from '../../../demo/workspaces/composables/useWorkspace'
type FormRenderSlotsType = {
  name: string
  component: any // FormRenderSlots
}
type FormStartHandle = {
  id: string
  cb: Function // 1. maybe return step
  isContinue: boolean
}
export const useWorkflow = () => {
  const formRenderSlots = useState<FormRenderSlotsType[]>('formRenderSlots', () =>
    shallowRef<FormRenderSlotsType[]>([
      {
        name: 'calendar',
        component: 'formWidgetCalendar'
      },
      {
        name: 'folderCabinet',
        component: 'formWidgetBrowse'
      },
      {
        name: 'caseInfo',
        component: 'formWidgetCaseInfo'
      },
      {
        name: 'updateDocument',
        component: 'formWidgetUpdateDocument'
      },
      {
        name: 'uploadFromDocpal',
        component: 'formWidgetUploadFromDocpal'
      }
    ])
  )
  const formStartHandle = useState<any>('formRenderSlots', () => ({}))
  const customStartCallBackList = useState<any>('customStartCallBack', () => ({}))
  const customWorkflowHandler = useState('customWorkflowHandler', () => shallowRef<any[]>([]))
  async function customStartCallBack(processKey: string, form: any) {
    const callback = customStartCallBackList.value[processKey]
    if (callback) {
      return await callback(form.properties)
    }
  }

  /**
   * Delete workspace and all related tables
   */
  async function deleteWorkspace(workspaceId: string): Promise<void> {
    const { deleteWorkspace: deleteWorkspaceFromDb } = useWorkspaces()
    await deleteWorkspaceFromDb(workspaceId)
  }

  return {
    customStartCallBackList,
    customStartCallBack,
    customWorkflowHandler,
    formRenderSlots,
    formStartHandle,
    deleteWorkspace
  }
}
