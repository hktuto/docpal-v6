import { createError, useState } from '#imports'
import { FormWidgetProformaInvoiceInfo } from '#components'

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
        component: 'FormWidgetCalendar'
      },
      {
        name: 'folderCabinet',
        component: 'FormWidgetBrowse'
      },
      {
        name: 'caseInfo',
        component: 'FormWidgetCaseInfo'
      },
      {
        name: 'updateDocument',
        component: 'FormWidgetUpdateDocument'
      },
      {
        name: 'uploadFromDocpal',
        component: 'FormWidgetUploadFromDocpal'
      },
      {
        name: 'customerVisitCustomerSelect',
        component: 'FormWidgetCustomerVisitCustomerSelect'
      },
      {
        name: 'sampleRequestCustomerInfo',
        component: 'FormWidgetSampleRequestCustomerInfo'
      },
      {
        name: 'sampleRequestInfo',
        component: 'FormWidgetSampleRequestInfo'
      },
      {
        name: 'sampleRequestPaFoundryCustom',
        component: 'FormWidgetSampleRequestPaFoundryCustom'
      },
      {
        name: 'sampleRequestPaInquireWithSuppliers',
        component: 'FormWidgetSampleRequestPaInquireWithSuppliers'
      },
      {
        name: 'sampleRequestPaFollowUp',
        component: 'FormWidgetSampleRequestPaFollowUp'
      },
      {
        name: 'sampleRequestSalespersonShipsGoods',
        component: 'FormWidgetSampleRequestSalespersonShipsGoods'
      },
      {
        name: 'sampleRequestSalespersonFollowUp',
        component: 'FormWidgetSampleRequestSalespersonFollowUp'
      },
      {
        name: 'quotationApprovalCustomerSelect',
        component: 'FormWidgetQuotationApprovalCustomerSelect'
      },
      {
        name: 'quotationApprovalSampleInfo',
        component: 'FormWidgetQuotationApprovalSampleInfo'
      },
      {
        name: 'quotationApprovalPcReviewInfo',
        component: 'FormWidgetQuotationApprovalPcReview'
      },
      {
        name: 'quotationApprovalInfo',
        component: 'FormWidgetQuotationApprovalInfo'
      },
      {
        name: 'salespersonConfirmInfo',
        component: 'FormWidgetQuotationApprovalSalespersonConfirmInfo'
      },
      {
        name: 'priceAnnouncementList',
        component: 'FormWidgetPriceAnnouncementList'
      },
      {
        name: 'salesOrderApprovalTable',
        component: 'FormWidgetSalesOrderApprovalTable'
      },
      {
        name: 'salesOrderApprovalModificationTable',
        component: 'FormWidgetSalesOrderApprovalModificationTable'
      },
      {
        name: 'proformaInvoiceInfo',
        component: 'FormWidgetProformaInvoiceInfo'
      },
      {
        name: 'proformaInvoiceApproval',
        component: 'FormWidgetProformaInvoiceApproval'
      },
      {
        name: 'returnMerchandiseApprovalTable',
        component: 'FormWidgetReturnMerchandiseApprovalTable'
      },
      {
        name: 'tnApprovalTable',
        component: 'FormWidgetTnApprovalTable'
      },
      {
        name: 'reschedulePlanDate',
        component: 'FormWidgetReschedulePlanDate'
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
    formStartHandle
  }
}

export const useWorkflowAdditionalContext = (f: Function) => {
  const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
  if (!graphProvider) {
    throw createError('graph provider not found')
  }

  function setUpListener() {
    graphProvider?.graph.value?.on('history:undo', () => {
      f()
    })
    graphProvider?.graph.value?.on('history:redo', () => {
      f()
    })
  }

  onMounted(() => {
    setUpListener()
    f()
  })
}
