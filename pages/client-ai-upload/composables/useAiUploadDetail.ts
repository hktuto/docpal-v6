import { ElMessageBox, ElNotification, ElMessage } from 'element-plus'
import { emitBus, EventType } from 'eventbus'
import { newClientApi } from 'api'

export function useAiUploadDetail(props: { id: string; status?: string }) {
  const routerProvider = inject(MenuRouterKey)
  const userId = useUserId()
  const { arrayToTree, getFileName } = useUploadAIStore()
  const { t } = useI18n()

  const treeRef = ref()
  const formRef = ref()

  const state = reactive<any>({
    loading: false,
    retryLoading: false,
    submitLoading: false,
    fileList: [],
    selectedDoc: {},
    repearNameIdList: [],
    status: props.status
  })

  function ocrPermission(doc: any): boolean {
    try {
      const extension = '.' + doc.name.split('.').pop()
      return !doc.isFolder && allowFeature('OCR') && canOCR(extension)
    } catch {
      return false
    }
  }

  function normalizeAiAnalysis(row: any) {
    if (!row.aiAnalysisDocument || row.aiAnalysis || !row.aiAnalysisDocument.metaDatas) return
    row.aiAnalysis = row.aiAnalysisDocument.metaDatas.reduce((prev: any, item: any) => {
      if (item.label || item.value) {
        prev[item.name] = {}
        if (item.label) prev[item.name].label = item.label
        if (item.value) prev[item.name].value = item.value
      }
      return prev
    }, {})
    if (!row.aiAnalysis) row.aiAnalysis = {}
    if (row.aiAnalysisDocument.documentType) {
      row.aiAnalysis.documentType = {
        value: row.aiAnalysisDocument.documentType
      }
    }
  }

  async function handleNodeClick(row: any) {
    if (row.id === state.selectedDoc.id) return
    state.selectedDoc = row
    state.selectedDoc.canOcr = ocrPermission(row)
    normalizeAiAnalysis(row)

    await formRef.value?.init(row.fileType, {
      isFolder: row.isFolder,
      aiAnalysis: row.aiAnalysis || {},
      aiDocId: row.id
    })
    setTimeout(() => {
      if (!row.properties) row.properties = {}
      formRef.value?.setData({
        ...row.properties,
        documentType: row.fileType,
        docName: getFileName(state.selectedDoc.name, row.isFolder)
      })
    }, 100)
  }

  async function handleMetaChange({ fieldName, formModel, newValue, oldValue }: any) {
    state.selectedDoc.properties = deepCopy(formModel)
    state.selectedDoc.fileType = formModel.documentType
    state.selectedDoc.docName = formModel.docName

    if (fieldName === 'documentType' && newValue !== oldValue && !!oldValue) {
      await formRef.value?.init(state.selectedDoc.fileType, {
        isFolder: state.selectedDoc.isFolder,
        aiAnalysis: state.selectedDoc.aiAnalysis || {},
        aiDocId: state.selectedDoc.id
      })
      setTimeout(() => {
        formRef.value?.setData({
          ...state.selectedDoc.properties,
          documentType: state.selectedDoc.fileType
        })
      })
    }
  }

  async function handleDiscard() {
    try {
      const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToCancel')}`, {
        confirmButtonText: t('dpButtom_confirm'),
        cancelButtonText: t('common_close')
      }).catch((action) => action)
      if (action !== 'confirm') return
      await newClientApi.postDmsUploadCancel({ userId: userId.value, uploadId: props.id }).then((r) => r.data)
      routerProvider?.navigateTo(goAiUploadDetail())
    } catch (error) {
      console.log(error)
    }
  }

  function handleClose() {
    routerProvider?.navigateTo(goAiUploadDetail())
  }

  async function handleRetry() {
    state.retryLoading = true
    try {
      const result = await newClientApi.getDmsDocumentRetryClassificationUploadid(props.id)
      if (result) {
        state.status = 'Prepare'
        routerProvider?.updateProps({ status: 'Prepare' })
      }
      await init()
    } catch (error) {
      console.log(error)
    }
    setTimeout(() => (state.retryLoading = false), 1000)
  }

  function buildFileConfirmDTOList(nodeMap: Record<string, any>) {
    const docList: any[] = []
    const fileConfirmDTOList = Object.keys(nodeMap).reduce((prev: any[], key) => {
      const nodeItem = { ...nodeMap[key].data }
      if (!nodeItem.properties) nodeItem.properties = {}
      const properties = Object.keys(nodeItem.properties).reduce((acc: any, propKey) => {
        const pValue = nodeItem.properties[propKey]
        if (pValue && !['documentType', 'docName'].includes(propKey)) acc[propKey] = pValue
        return acc
      }, {})
      const extraParams: any = {}
      if (!nodeItem.isFolder) {
        const itemNames = nodeItem.name.split('.')
        extraParams.fileSuffix = itemNames.pop()
      }
      prev.push({
        id: key,
        parentId: nodeItem.parentId,
        docName: nodeItem.docName || getFileName(nodeItem.name, nodeItem.isFolder),
        metadatas: JSON.stringify(properties),
        documentType: nodeItem.fileType,
        ...extraParams
      })
      docList.push({
        name: nodeItem.name,
        documentType: nodeItem.fileType,
        properties
      })
      return prev
    }, [])
    return { fileConfirmDTOList, docList }
  }

  async function checkFailedListExist(fileConfirmDTOList: any[]): Promise<boolean> {
    const checkFailedList: any = await newClientApi
      .postDmsUploadValidation({
        uploadId: props.id,
        fileCheckList: fileConfirmDTOList.reduce((prev, item) => {
          if (!item.parentId) {
            prev.push({
              id: item.id,
              docName: item.docName,
              fileSuffix: '.' + item.fileSuffix
            })
          }
          return prev
        }, [])
      })
      .then((res: any) => res.data.checkFailedList)

    state.repearNameIdList = []
    const fileNames = checkFailedList.reduce((prev: any[], item: any) => {
      prev.push(item.docName)
      state.repearNameIdList.push(item.id)
      return prev
    }, [])

    if (checkFailedList?.length > 0) {
      const noti = ElNotification({
        title: 'Duplicate File',
        message: `A file with the name ${fileNames.join(', ')} already exists in this folder. Please rename the file and try again.`,
        type: 'warning',
        duration: 0,
        onClick() {
          noti.close()
        }
      })
    }
    return checkFailedList?.length > 0
  }

  async function handleSubmit() {
    const nodeMap = treeRef.value!.getNodesMap()
    const { fileConfirmDTOList } = buildFileConfirmDTOList(nodeMap)
    try {
      state.submitLoading = true
      if (await checkFailedListExist(fileConfirmDTOList)) return
      const data: any = await newClientApi
        .postDmsUploadConfirm({
          userId: userId.value,
          uploadId: props.id,
          fileConfirmDTOList
        })
        .then((r) => r.data)

      if (data.uploadSuccess) {
        routerProvider?.navigateTo(goAiUploadDetail())
        emitBus(EventType.FILE_NEED_REFRESH, {
          relatedIdOrPath: data.parentId
        })
      } else {
        throw new Error(t('dpMsg_503'))
      }
    } catch (error: any) {
      if (error.message) ElMessage.error(error.message)
    } finally {
      setTimeout(() => {
        state.submitLoading = false
      }, 100)
    }
  }

  async function init() {
    state.loading = true
    try {
      let docList: any = await newClientApi
        .postDmsUploadQueryItems({
          userId: userId.value,
          uploadId: props.id
        })
        .then((res) => res.data)
      docList = docList.map((item: any) => ({
        ...item,
        isFolder: item.fileType === 'Folder'
      }))
      state.fileList = arrayToTree(docList)
      if (state.fileList.length > 0) {
        setTimeout(() => {
          handleNodeClick(state.fileList[0])
          treeRef.value?.setCurrentKey(state.fileList[0].id)
        }, 100)
      }
    } finally {
      state.loading = false
    }
  }

  onMounted(async () => {
    await init()
  })

  return {
    state,
    treeRef,
    formRef,
    handleNodeClick,
    handleMetaChange,
    handleDiscard,
    handleClose,
    handleRetry,
    handleSubmit
  }
}
