import { useState, createError } from '#imports'
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

  return {
    customStartCallBackList,
    customStartCallBack,
    customWorkflowHandler,
    formRenderSlots,
    formStartHandle,
  }
}
