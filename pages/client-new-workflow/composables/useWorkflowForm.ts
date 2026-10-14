import { computed, inject, provide, ref, toValue, watch, type ComputedRef, type InjectionKey, type MaybeRefOrGetter, type Ref } from 'vue'
import { newClientApi, clientApi } from 'api'
import { CellType, getButtonAdditionalElement, workflowResponseHelper } from '#imports'

export type WorkflowSignSubmitStage = 'beforeSubmit' | 'afterSubmit'

export type WorkflowFormAction = 'submit' | 'terminate'

export interface WorkflowFormActionSuccessPayload {
  action: WorkflowFormAction
  dbId: string
  processId?: string
}

export interface WorkflowFormProviderProps {
  workflowType: MaybeRefOrGetter<string>
  /** 任务 db_id；completeTask 时可为列表行推导出的 id */
  dbId: MaybeRefOrGetter<string>
  /** 列表选中行 / completeTask 的 detail 源数据 */
  sourceTask?: MaybeRefOrGetter<Record<string, any> | null | undefined>
  /** 详情页表单未挂载时，临时切到 form tab 并在回调内执行 setForm */
  ensureFormTab?: (run: () => void | Promise<void>) => void | Promise<void>
  /** drawer submit/terminate 成功回调；不传则按钮走默认跳转 */
  onActionSuccess?: (payload: WorkflowFormActionSuccessPayload) => void
}

export interface WorkflowFormContext {
  workflowType: ComputedRef<string>
  taskDetail: Ref<Record<string, any>>
  variables: Ref<any[]>
  isAssigneeUser: ComputedRef<boolean>
  nodeType: Ref<string>
  signSubmitStage: Ref<WorkflowSignSubmitStage>
  signatureDetail: Ref<Record<string, any> | null | undefined>
  temSignatureData: Ref<any>
  formDataValue: Ref<any>
  pageButtonSetting: Ref<any>
  additionalButton: Ref<{ props: any; component: string }[]>
  showForm: Ref<boolean>
  disabled: ComputedRef<boolean>
  loading: Ref<boolean>
  error: Ref<any>
  selectedTitle: ComputedRef<string>
  workflowFormRef: Ref<any>
  getFormData: (needValidation: boolean, skip?: boolean) => Promise<any>
  getAdditionalButtons: () => any[]
  openSignatureSettingDialog: () => void
  onActionSuccess?: (payload: WorkflowFormActionSuccessPayload) => void
  applyAdditionalSetting: (nodes: any[], metadata: any, formVariables: any) => Promise<void>
  resetFormSettings: () => void
  loadForm: () => Promise<void>
  handleClaimChange: (claimed: boolean) => Promise<void>
  handleDisabledForm: () => void
}

export const WorkflowFormKey: InjectionKey<WorkflowFormContext> = Symbol('WorkflowForm')

export function useWorkflowFormProvider(props: WorkflowFormProviderProps) {
  const routerProvider = inject(MenuRouterKey, null)
  const userId = useUserId().value

  const workflowFormRef = ref<any>()
  const taskDetail = ref<Record<string, any>>({})
  const variablesData = ref<Record<string, any>>({})
  const variables = ref<any[]>([])
  const loading = ref(false)
  const error = ref<any>(null)

  const nodeType = ref<'UserTask' | 'SignatureTask'>('UserTask')
  const showForm = ref(true)
  const formDataValue = ref<any>(null)
  const signSubmitStage = ref<WorkflowSignSubmitStage>('beforeSubmit')
  const additionalButton = ref<{ props: any; component: string }[]>([])
  const signatureDetail = ref<Record<string, any> | null>()
  const pageButtonSetting = ref<any>()
  const temSignatureData = ref<any>(null)

  const workflowType = computed(() => String(toValue(props.workflowType) || ''))
  const dbId = computed(() => String(toValue(props.dbId) || ''))
  const sourceTask = computed(() => toValue(props.sourceTask) || null)

  const disabled = computed(() => workflowType.value === 'completeTask')
  const isAssigneeUser = computed(
    () => taskDetail.value?.config?.human_task?.assignee === userId
  )

  const selectedTitle = computed(() => {
    const row = taskDetail.value?.db_id ? taskDetail.value : sourceTask.value
    if (!row) return ''
    return row?.execution?.input_variables?.business_key || row?.config?.human_task?.form_title || row?.name || ''
  })

  function getFormData(needValidation: boolean, skip?: boolean) {
    return workflowFormRef.value?.getFormData?.(needValidation, skip)
  }

  function getAdditionalButtons() {
    return workflowFormRef.value?.getAdditionalButtons?.() || []
  }

  function openSignatureSettingDialog() {
    workflowFormRef.value?.openSignatureSettingDialog?.()
  }

  function handleDisabledForm() {
    nextTick(() => {
      if (!isAssigneeUser.value || disabled.value) {
        workflowFormRef.value?.disableForm?.()
      } else {
        workflowFormRef.value?.enableForm?.()
      }
    })
  }

  async function applyAdditionalSetting(nodes: any[], metadata: any, formVariables: any) {
    const setting: any = await getButtonAdditionalElement(nodes, metadata, formVariables)
    additionalButton.value = setting.buttons
    pageButtonSetting.value = setting.buttonSetting
    nodeType.value = metadata.type
    if (nodeType.value === CellType.signatureTask) {
      signatureDetail.value = setting.signatureSetting
      signSubmitStage.value = 'beforeSubmit'
    } else {
      signatureDetail.value = null
    }
  }

  function resetFormSettings() {
    pageButtonSetting.value = null
    additionalButton.value = []
    signatureDetail.value = null
    signSubmitStage.value = 'beforeSubmit'
    temSignatureData.value = null
    formDataValue.value = null
  }

  async function initForm(node: any) {
    const formKey = node.config?.human_task?.form_key
    if (!formKey) {
      routerProvider?.message.error('The formKey does not exist!')
      return
    }

    const formJsonData = await newClientApi.getDmsFormPropertiesId(formKey).then((r: any) => r.data)
    if (!formJsonData || !formJsonData.jsonValue) {
      routerProvider?.message.error('The form does not exist!')
      return
    }

    await nextTick()
    if (!workflowFormRef.value && showForm.value && props.ensureFormTab) {
      await props.ensureFormTab(async () => {
        workflowFormRef.value?.setForm?.(formJsonData.jsonValue, variablesData.value)
      })
    } else {
      workflowFormRef.value?.setForm?.(formJsonData.jsonValue, variablesData.value)
    }
    handleDisabledForm()
    await nextTick()
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'))
    })
  }

  async function loadForm() {
    resetFormSettings()
    error.value = null

    if (!dbId.value) {
      error.value = 'Id not exist'
      taskDetail.value = sourceTask.value || {}
      return
    }

    if (workflowType.value === 'completeTask') {
      showForm.value = false
      taskDetail.value = sourceTask.value || {}
      return
    }

    loading.value = true
    try {
      const data: any = await clientApi.instance
        .get(`/oniflow/api/v1/processes/instance-task/${dbId.value}`)
        .then((r: any) => workflowResponseHelper(r))
      if (!data) {
        error.value = 'Get Task Detail Failed'
        routerProvider?.message.error('Get Task Detail Failed')
        return
      }
      taskDetail.value = data

      const instanceData = await clientApi.instance
        .get(`/oniflow/api/v1/processes/instance/${data.process_id}`)
        .then((r: any) => workflowResponseHelper(r))
      variablesData.value = instanceData.variables || {}

      const contentData = await clientApi.instance
        .get(`/oniflow/api/v1/workflow/definitions/instance/${instanceData.definition_id}/content`)
        .then((r: any) => workflowResponseHelper(r))

      variables.value = Object.entries(contentData.variables || {}).map(([key, value]) => ({
        id: key,
        ...(value as object)
      }))

      await applyAdditionalSetting(contentData.nodes, data.metadata, variables.value)
      await initForm(data)
    } catch (e) {
      console.error(e)
      error.value = e
    } finally {
      loading.value = false
      await nextTick()
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'))
      })
    }
  }

  async function handleClaimChange(claimed: boolean) {
    if (!taskDetail.value.config) taskDetail.value.config = {}
    if (!taskDetail.value.config.human_task) taskDetail.value.config.human_task = {}
    if (!taskDetail.value.status) taskDetail.value.status = {}

    taskDetail.value.config.human_task.assignee = claimed ? userId : ''
    taskDetail.value.status.type = claimed ? 'assigned' : 'waiting'

    if (!claimed) {
      handleDisabledForm()
      return
    }
    workflowFormRef.value?.enableForm?.()
    await nextTick()
    await workflowFormRef.value?.updateData?.(variablesData.value)
  }

  function handleActionSuccess(payload: WorkflowFormActionSuccessPayload) {
    const listDbId = sourceTask.value?.db_id ?? payload.dbId
    props.onActionSuccess?.({
      ...payload,
      dbId: listDbId
    })
  }

  const context: WorkflowFormContext = {
    workflowType,
    taskDetail,
    variables,
    isAssigneeUser,
    nodeType,
    signSubmitStage,
    signatureDetail,
    temSignatureData,
    formDataValue,
    pageButtonSetting,
    additionalButton,
    showForm,
    disabled,
    loading,
    error,
    selectedTitle,
    workflowFormRef,
    getFormData,
    getAdditionalButtons,
    openSignatureSettingDialog,
    onActionSuccess: props.onActionSuccess ? handleActionSuccess : undefined,
    applyAdditionalSetting,
    resetFormSettings,
    loadForm,
    handleClaimChange,
    handleDisabledForm
  }

  provide(WorkflowFormKey, context)

  watch(
    () => [dbId.value, workflowType.value],
    () => {
      loadForm()
    },
    { immediate: true }
  )

  return context
}

export function useWorkflowFormInject(): WorkflowFormContext {
  const context = inject(WorkflowFormKey)
  if (!context) {
    throw new Error('WorkflowForm context not found. Make sure useWorkflowFormProvider is called in a parent component.')
  }
  return context
}
