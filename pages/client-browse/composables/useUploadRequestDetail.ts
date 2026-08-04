import { createUploadRequestPageParams } from '../utils/browseMenuHelper'
import { newClientApi } from 'api'

function normalizeProperties(properties: any) {
  if (!properties) return {}
  if (typeof properties !== 'string') {
    return typeof properties === 'object' && !Array.isArray(properties) ? properties : {}
  }
  try {
    const parsedProperties = JSON.parse(properties)
    return parsedProperties && typeof parsedProperties === 'object' && !Array.isArray(parsedProperties)
      ? parsedProperties
      : {}
  } catch {
    return {}
  }
}

export function useUploadRequestDetail(props: { id: string; paramKey?: string }) {
  const routerProvider = inject(MenuRouterKey)
  const userId = useUserId()

  const listRef = ref()
  const formRef = ref()

  const state = reactive<any>({
    uploadId: '',
    applyDocumentType: 'File',
    fileTypes: [],
    errorFileNum: 0,
    loading: false,
    submitLoading: false,
    selectedRow: {},
    selectedRows: [],
    checkAll: false,
    tableData: []
  })

  const previewFile = reactive<any>({
    blob: null,
    name: '',
    id: '',
    loading: false,
    downloadLoading: false,
    options: {
      readOnly: true
    }
  })

  async function handleDocTypeChange(row: any) {
    await formRef.value?.init(row.documentType)
  }

  function handleMetaChange(data: any) {
    if (!state.loading) state.selectedRow.properties = deepCopy(data.formModel)
  }

  function handleApply(formModel: any) {
    state.tableData.forEach((item: any) => {
      if (item.documentType === state.selectedRow.documentType) {
        item.properties = normalizeProperties(item.properties)
        item.properties[formModel.name] = formModel.value
      }
    })
  }

  function applyToSelect() {
    state.selectedRows = listRef.value?.getCheckedNodes() ?? []
    state.loading = true
    state.selectedRows.forEach((item: any) => {
      item.documentType = state.applyDocumentType
      item.properties = {}
    })
    handleDocTypeChange(state.selectedRow)
    setTimeout(() => {
      state.loading = false
    }, 500)
  }

  async function getPreview(row: any) {
    previewFile.loading = true
    try {
      previewFile.name = row.initName
      previewFile.blob = await newClientApi.getDmsUploadRequestTempFileId(row.id, {
        format: 'blob',
        timeout: 0
      })
    } catch {
      // ignore preview errors
    }
    previewFile.loading = false
    previewFile.id = row.id
  }

  async function handleNodeClick(row: any) {
    getPreview(row)
    state.loading = true
    state.selectedRow = row
    await handleDocTypeChange(row)
    if (state.selectedRow.properties) await formRef.value?.setData(state.selectedRow.properties)
    setTimeout(() => {
      state.loading = false
    }, 1000)
  }

  async function handleDownload() {
    try {
      previewFile.downloadLoading = true
      const blob: any = await newClientApi.getDmsUploadRequestTempFileId(previewFile.id, {
        format: 'blob',
        timeout: 0
      })
      downloadBlob(blob, previewFile.name || state.selectedRow.name, blob.type)
    } catch {
      // ignore download errors
    } finally {
      previewFile.downloadLoading = false
    }
  }

  function handleCheckAll(value: boolean) {
    if (value) listRef.value?.setCheckedKeys(state.tableData.map((item: any) => item.id))
    else listRef.value?.setCheckedKeys([])
  }

  function handleCheckChange() {
    state.selectedRows = listRef.value?.getCheckedNodes() ?? []
    state.checkAll = state.selectedRows.length === state.tableData.length
  }

  async function handleSubmit() {
    try {
      await formRef.value?.validate()
    } catch (e) {
      console.error(e)
      return
    }
    state.submitLoading = true
    try {
      const param = {
        uploadRequestId: state.uploadId,
        userId: userId.value,
        uploadRequestItemList: state.tableData.map((item: any) => ({
          id: item.id,
          docName: item.initName || item.name,
          approve: item.approved || false,
          documentType: item.documentType,
          metadatas: JSON.stringify(item.properties)
        }))
      }
      const res = await newClientApi.postDmsUploadRequestApproval(param).then((r: any) => r.result)
      if (res) routerProvider?.navigateTo(createUploadRequestPageParams({}))
    } catch {
      // ignore submit errors
    }
    state.submitLoading = false
  }

  async function getData() {
    state.loading = true
    try {
      const response: any = await newClientApi.getDmsUploadRequestId(props.id).then((res) => res.data)
      state.uploadId = response.id
      state.tableData = response.uploadRequestItemList.map((item: any) => ({
        ...item,
        approved: item.approved || false,
        documentType: item.fileType || 'File',
        properties: normalizeProperties(item.metaDatas)
      }))
      if (state.tableData.length > 0) handleNodeClick(state.tableData[0])
    } catch {
      state.tableData = []
      state.selectedRow = {}
    } finally {
      state.loading = false
    }
  }

  async function loadFileTypes() {
    const res: any = await newClientApi.getDmsDocpalTypeActive().then((r) => r.data)
    state.fileTypes = res.filter((item: any) => !item.isFolder)
  }

  onMounted(() => {
    getData()
    loadFileTypes()
  })

  return {
    state,
    previewFile,
    listRef,
    formRef,
    applyToSelect,
    handleNodeClick,
    handleCheckAll,
    handleCheckChange,
    handleDocTypeChange,
    handleMetaChange,
    handleApply,
    handleDownload,
    handleSubmit
  }
}
