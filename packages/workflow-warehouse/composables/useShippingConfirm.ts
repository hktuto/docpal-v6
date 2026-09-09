import { computed, inject, onBeforeUnmount, onMounted, provide, reactive, ref, toRef, watch, type InjectionKey, type Ref } from '#imports'
import { clientApi } from 'api'
import { ElMessage } from 'element-plus'
import { getFileDisplayName, resolveWorkflowFile } from '../utils/workflowHelper'

export type ShippingConfirmResultResponse = {
  out_request_no?: string
  request?: {
    poll_status?: string
    compare_status?: string
    error_message?: string | null
  } | null
  compare?: {
    out_request_no?: string
    org_id?: string
    pi_num?: string
    final_status?: string
    manual_edit_json?: Record<string, any>
    compare_result_json?: {
      summary?: string
      differences?: Array<{
        rule?: string
        message?: string
      }>
    } | null
    extra_json?: {
      manual_edit_sync?: {
        status?: string
      }
    } | null
  } | null
}

export type ShippingConfirmManualEdit = {
  shipConfirmDate: string
}

export interface ShippingConfirmProps {
  formData: Record<string, any>
  taskDetail?: Record<string, any>
  disabled?: boolean
}

export interface ShippingConfirmContext {
  formData: Ref<Record<string, any>>
  taskDetail: Ref<Record<string, any> | undefined>
  disabled: Ref<boolean | undefined>
  outRequestNo: Ref<string>
  previewDocId: Ref<string>
  previewFileName: Ref<string>
  displayPiNum: Ref<string>
  requestStatus: Ref<string>
  finalStatus: Ref<string>
  loading: Ref<boolean>
  saving: Ref<boolean>
  refreshing: Ref<boolean>
  result: Ref<ShippingConfirmResultResponse | null>
  manualEdit: ShippingConfirmManualEdit
  isDirty: Ref<boolean>
  errorMessage: Ref<string>
  isProcessing: Ref<boolean>
  isSuccess: Ref<boolean>
  isFailure: Ref<boolean>
  pollingTimedOut: Ref<boolean>
  summary: Ref<string>
  differences: Ref<Array<{ rule?: string; message?: string }>>
  manualEditSyncStatus: Ref<string>
  requestErrorMessage: Ref<string>
  updateManualEdit: (field: keyof ShippingConfirmManualEdit, value: string) => void
  saveManualEdit: () => Promise<boolean>
  refreshResult: () => Promise<void>
  validateForSubmit: () => Promise<void>
  buildSubmitPayload: () => Record<string, any>
}

export const ShippingConfirmKey: InjectionKey<ShippingConfirmContext> = Symbol('ShippingConfirm')

const POLLING_STATUSES = new Set(['submitted', 'polling'])
const POLLING_INTERVAL_MS = 5000
const POLLING_TIMEOUT_MS = 2 * 60 * 1000

function readValue<T = any>(source: Record<string, any> | null | undefined, keys: string[]): T | undefined {
  if (!source || typeof source !== 'object') return undefined
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') return value as T
  }
  return undefined
}

function pickValue(source: Record<string, any> | null | undefined, keys: string[]) {
  const value = readValue(source, keys)
  if (value === undefined) return ''
  return String(value)
}

function readObject(source: Record<string, any> | null | undefined, keys: string[]) {
  const value = readValue(source, keys)
  return value && typeof value === 'object' ? value : undefined
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRequestPayload(result: ShippingConfirmResultResponse | null) {
  return readObject(result || undefined, ['request'])
}

function getComparePayload(result: ShippingConfirmResultResponse | null) {
  return readObject(result || undefined, ['compare'])
}

function getRequestStatusValue(result: ShippingConfirmResultResponse | null) {
  return pickValue(getRequestPayload(result), ['poll_status', 'pollStatus'])
}

function getCompareStatusValue(result: ShippingConfirmResultResponse | null) {
  return pickValue(getRequestPayload(result), ['compare_status', 'compareStatus'])
}

function getFinalStatusValue(result: ShippingConfirmResultResponse | null) {
  return pickValue(getComparePayload(result), ['final_status', 'finalStatus'])
}

function getRequestErrorValue(result: ShippingConfirmResultResponse | null) {
  return pickValue(getRequestPayload(result), ['error_message', 'errorMessage'])
}

function getCompareResultPayload(result: ShippingConfirmResultResponse | null) {
  return readObject(getComparePayload(result), ['compare_result_json', 'compareResultJson'])
}

function getManualEditPayload(result: ShippingConfirmResultResponse | null) {
  const manualEdit = readValue(getComparePayload(result), ['manual_edit_json', 'manualEditJson'])
  return isPlainObject(manualEdit) ? manualEdit : undefined
}

function getManualEditSyncValue(result: ShippingConfirmResultResponse | null) {
  const extraJson = readObject(getComparePayload(result), ['extra_json', 'extraJson'])
  const manualEditSync = readObject(extraJson, ['manual_edit_sync', 'manualEditSync'])
  return pickValue(manualEditSync, ['status'])
}

function getPrimaryDocumentId(result: ShippingConfirmResultResponse | null) {
  return pickValue(getRequestPayload(result), ['primary_document_id', 'primaryDocumentId'])
}

function hasExpectedResult(result: ShippingConfirmResultResponse | null) {
  if (!result) return false
  const compareStatus = getCompareStatusValue(result)
  const finalStatus = getFinalStatusValue(result)
  const compare = getComparePayload(result)
  return compareStatus === 'completed' && !!compare && !!finalStatus
}

function getNormalizedPayload(result: ShippingConfirmResultResponse | null) {
  const compare = getComparePayload(result)
  return readObject(compare, ['normalized']) || readObject(readObject(compare, ['source_payload', 'sourcePayload']), ['normalized']) || undefined
}

function getPreviewHeaderPayload(result: ShippingConfirmResultResponse | null) {
  const compare = getComparePayload(result)
  const previewPayload = readObject(compare, ['preview_payload', 'previewPayload'])
  return readObject(previewPayload, ['header']) || previewPayload
}

function getResultPreviewFileName(result: ShippingConfirmResultResponse | null) {
  const request = getRequestPayload(result)
  const resultDataJson = readObject(request, ['result_data_json', 'resultDataJson'])
  const dataList = readValue<any[]>(resultDataJson, ['data'])
  if (!Array.isArray(dataList)) return ''
  for (const item of dataList) {
    const documents = readValue<any[]>(item, ['Documents', 'documents'])
    if (!Array.isArray(documents)) continue
    for (const document of documents) {
      const documentData = readObject(document, ['DocumentData', 'documentData'])
      const fields = readValue<any[]>(documentData, ['Fields', 'fields'])
      if (!Array.isArray(fields)) continue
      const imageSource = fields.find((field) => pickValue(field, ['Name', 'name']) === 'Image_Source')
      const fileName = pickValue(imageSource, ['Value', 'value'])
      if (fileName) return fileName
    }
  }
  return ''
}

function pickFromSources(sources: Array<Record<string, any> | null | undefined>, keys: string[]) {
  for (const source of sources) {
    const value = pickValue(source, keys)
    if (value) return value
  }
  return ''
}

function buildDefaultManualEdit(sources: Array<Record<string, any> | null | undefined>): ShippingConfirmManualEdit {
  return {
    shipConfirmDate: pickFromSources(sources, ['shipConfirmDate', 'ship_confirm_date', 'shipDate', 'ship_date', 'effective_ship_date', 'effectiveShipDate'])
  }
}

function resolveOutRequestNo(formData: Record<string, any>, taskDetail?: Record<string, any>) {
  return pickFromSources(
    [
      formData,
      formData?.shippingConfirm,
      formData?.shippingConfirmResult,
      taskDetail,
      taskDetail?.properties,
      taskDetail?.variables,
      taskDetail?.form_data,
      taskDetail?.common_config,
      taskDetail?.commonConfig,
      taskDetail?.config,
      taskDetail?.config?.common_config,
      taskDetail?.config?.commonConfig,
      taskDetail?.config?.human_task,
      taskDetail?.config?.initialise
    ],
    [
      'out_request_no',
      'outRequestNo',
      'shipping_confirm_out_request_no',
      'shippingConfirmOutRequestNo',
      'shippingConfirmRequestNo',
      'shipping_confirm_request_no'
    ]
  )
}

function resolvePreviewMeta(formData: Record<string, any>) {
  const fileList: Record<string, any>[] = Array.isArray(formData?.file_list_info) ? formData.file_list_info : []
  const explicitName = pickFromSources([formData], ['fileName', 'file_name'])
  const explicitId = pickFromSources([formData], ['fileId', 'file_id'])
  const resolvedFile = resolveWorkflowFile(explicitName, fileList) ?? fileList[0] ?? null
  return {
    previewDocId: resolvedFile?.id != null ? String(resolvedFile.id) : explicitId,
    previewFileName: getFileDisplayName(resolvedFile) || explicitName
  }
}

export function useShippingConfirmProvider(props: ShippingConfirmProps) {
  const { t } = useI18n()
  const userId = useUserId()
  const formData = toRef(props, 'formData')
  const taskDetail = toRef(props, 'taskDetail')
  const disabled = toRef(props, 'disabled')

  const result = ref<ShippingConfirmResultResponse | null>(null)
  const loading = ref(false)
  const saving = ref(false)
  const refreshing = ref(false)
  const isDirty = ref(false)
  const errorMessage = ref('')
  const requestErrorMessage = ref('')
  const initializedManualEdit = ref(false)
  const pollingTimedOut = ref(false)
  const previewDocId = ref('')
  const previewFileName = ref('')
  const manualEdit = reactive<ShippingConfirmManualEdit>({
    shipConfirmDate: ''
  })

  const outRequestNo = computed(() => resolveOutRequestNo(formData.value || {}, taskDetail.value))
  const requestStatus = computed(() => getRequestStatusValue(result.value))
  const compareStatus = computed(() => getCompareStatusValue(result.value))
  const finalStatus = computed(() => getFinalStatusValue(result.value))
  const differences = computed(() => {
    const list = readValue<any[]>(getCompareResultPayload(result.value), ['differences'])
    return Array.isArray(list) ? list : []
  })
  const isProcessing = computed(() => {
    if (!outRequestNo.value) return false
    if (pollingTimedOut.value || hasExpectedResult(result.value)) return false
    return POLLING_STATUSES.has(requestStatus.value) || !compareStatus.value || !getComparePayload(result.value)
  })
  const isSuccess = computed(() => compareStatus.value === 'completed' && finalStatus.value === 'CL')
  const isFailure = computed(() => compareStatus.value === 'completed' && finalStatus.value === 'OP')
  const summary = computed(() => {
    if (!outRequestNo.value) return t('workflowWarehouse.shippingConfirmMissingRequestNo')
    const compareSummary = pickValue(getCompareResultPayload(result.value), ['summary'])
    if (compareSummary) return compareSummary
    if (isSuccess.value) return t('workflowWarehouse.shippingConfirmSuccessSummary')
    if (pollingTimedOut.value) return t('workflowWarehouse.shippingConfirmPollingTimeoutSummary')
    if (isProcessing.value) return t('workflowWarehouse.shippingConfirmProcessingSummary')
    return t('workflowWarehouse.shippingConfirmPendingSummary')
  })
  const manualEditSyncStatus = computed(() => getManualEditSyncValue(result.value))
  const displayPiNum = computed(() => {
    const fromResult = pickValue(getComparePayload(result.value), ['pi_num', 'piNum'])
    if (fromResult) return fromResult
    const fromForm = pickFromSources([formData.value], ['piNum', 'pi_num', 'invoiceNum', 'invoice_num'])
    if (fromForm) return fromForm
    const fromFile = previewFileName.value.replace(/\.[^.]+$/, '')
    return fromFile
  })

  let pollTimer: ReturnType<typeof setTimeout> | null = null
  let pollStartAt = 0

  function clearPollTimer() {
    if (pollTimer) {
      clearTimeout(pollTimer)
      pollTimer = null
    }
  }

  function syncManualEditFromLatest() {
    const latest = buildDefaultManualEdit([
      getManualEditPayload(result.value),
      getNormalizedPayload(result.value),
      getPreviewHeaderPayload(result.value),
      formData.value,
      getComparePayload(result.value)
    ])
    manualEdit.shipConfirmDate = latest.shipConfirmDate
    isDirty.value = false
    initializedManualEdit.value = true
  }

  function resetPollingState() {
    clearPollTimer()
    pollingTimedOut.value = false
    pollStartAt = 0
  }

  function stopPolling(timeout = false) {
    clearPollTimer()
    pollingTimedOut.value = timeout
    if (timeout || hasExpectedResult(result.value)) {
      pollStartAt = 0
    }
  }

  function schedulePoll() {
    clearPollTimer()
    if (!outRequestNo.value) return
    if (!pollStartAt) {
      pollStartAt = Date.now()
      pollingTimedOut.value = false
    }
    if (Date.now() - pollStartAt >= POLLING_TIMEOUT_MS) {
      stopPolling(true)
      return
    }
    pollTimer = setTimeout(() => {
      fetchResult(true, true)
    }, POLLING_INTERVAL_MS)
  }

  async function fetchResult(silent = false, isPollingRequest = false) {
    clearPollTimer()
    if (!outRequestNo.value) {
      errorMessage.value = t('workflowWarehouse.shippingConfirmMissingRequestNo')
      requestErrorMessage.value = ''
      result.value = null
      return
    }

    errorMessage.value = ''
    requestErrorMessage.value = ''
    if (silent) {
      refreshing.value = true
    } else {
      loading.value = true
    }

    try {
      const response = await clientApi.instance.get(
        `/v1/ms/oracle/shipping-confirm/result/by-request-no?outRequestNo=${encodeURIComponent(outRequestNo.value)}`,
        {
          baseURL: '/apis'
        }
      )
      result.value = response.data ?? null
      requestErrorMessage.value = getRequestErrorValue(result.value)
      if (!initializedManualEdit.value || !isDirty.value) {
        syncManualEditFromLatest()
      }
      if (!previewDocId.value) {
        previewDocId.value = getPrimaryDocumentId(result.value)
      }
      if (!previewFileName.value) {
        previewFileName.value = getResultPreviewFileName(result.value)
      }
      if (hasExpectedResult(result.value)) {
        stopPolling()
      } else {
        schedulePoll()
      }
    } catch (error: any) {
      console.error(error)
      errorMessage.value = error?.message || t('workflowWarehouse.shippingConfirmFetchFailed')
      if (isPollingRequest || !silent) {
        schedulePoll()
      }
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  function updateManualEdit(field: keyof ShippingConfirmManualEdit, value: string) {
    manualEdit[field] = value
    isDirty.value = true
  }

  async function saveManualEdit() {
    if (!outRequestNo.value) {
      ElMessage.error(t('workflowWarehouse.shippingConfirmMissingRequestNo'))
      return false
    }

    saving.value = true
    try {
      await clientApi.instance.post(
        '/v1/ms/oracle/shipping-confirm/manual-edit',
        {
          outRequestNo: outRequestNo.value,
          manualEditJson: {
            shipConfirmDate: manualEdit.shipConfirmDate
          },
          operatorId: userId.value
        },
        {
          baseURL: '/apis'
        }
      )
      isDirty.value = false
      ElMessage.success(t('workflowWarehouse.shippingConfirmDraftSaved'))
      await fetchResult(true)
      return true
    } catch (error: any) {
      console.error(error)
      ElMessage.error(error?.message || t('workflowWarehouse.shippingConfirmDraftSaveFailed'))
      return false
    } finally {
      saving.value = false
    }
  }

  async function refreshResult() {
    resetPollingState()
    await fetchResult(true)
  }

  async function validateForSubmit() {
    if (!outRequestNo.value) {
      throw new Error(t('workflowWarehouse.shippingConfirmMissingRequestNo'))
    }
    if (!result.value || !hasExpectedResult(result.value)) {
      if (pollingTimedOut.value) {
        throw new Error(t('workflowWarehouse.shippingConfirmPollingTimeout'))
      }
      throw new Error(t('workflowWarehouse.shippingConfirmResultMissing'))
    }
    if (isProcessing.value) {
      throw new Error(t('workflowWarehouse.shippingConfirmStillProcessing'))
    }
  }

  function buildSubmitPayload() {
    return {
      shippingConfirmOutRequestNo: outRequestNo.value,
      shippingConfirmManualEditJson: {
        shipConfirmDate: manualEdit.shipConfirmDate
      },
      shippingConfirmRequestStatus: requestStatus.value,
      shippingConfirmFinalStatus: finalStatus.value,
      shippingConfirmResult: result.value
    }
  }

  const context: ShippingConfirmContext = {
    formData,
    taskDetail,
    disabled,
    outRequestNo,
    previewDocId,
    previewFileName,
    displayPiNum,
    requestStatus,
    finalStatus,
    loading,
    saving,
    refreshing,
    result,
    manualEdit,
    isDirty,
    errorMessage,
    isProcessing,
    isSuccess,
    isFailure,
    pollingTimedOut,
    summary,
    differences,
    manualEditSyncStatus,
    requestErrorMessage,
    updateManualEdit,
    saveManualEdit,
    refreshResult,
    validateForSubmit,
    buildSubmitPayload
  }

  provide(ShippingConfirmKey, context)

  onMounted(() => {
    const previewMeta = resolvePreviewMeta(formData.value || {})
    previewDocId.value = previewMeta.previewDocId
    previewFileName.value = previewMeta.previewFileName
    resetPollingState()
    fetchResult()
  })

  onBeforeUnmount(() => {
    resetPollingState()
  })

  watch(
    () => formData.value,
    (value) => {
      const previewMeta = resolvePreviewMeta(value || {})
      previewDocId.value = previewMeta.previewDocId
      previewFileName.value = previewMeta.previewFileName
    },
    { deep: true }
  )

  watch(
    () => outRequestNo.value,
    (value, oldValue) => {
      if (!value || value === oldValue) return
      initializedManualEdit.value = false
      resetPollingState()
      fetchResult()
    }
  )

  return context
}

export function useShippingConfirmInject(): ShippingConfirmContext {
  const context = inject(ShippingConfirmKey)
  if (!context) {
    throw new Error('ShippingConfirm context not found. Make sure useShippingConfirmProvider is called in a parent component.')
  }
  return context
}
