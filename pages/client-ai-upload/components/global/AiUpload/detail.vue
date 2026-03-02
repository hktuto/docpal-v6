<template>
  <div class="pageContainer">
    <main class="upload-main" v-loading="state.loading">
      <Splitpanes
        id="panesContainer"
        class="default-theme"
        @resize="dragging = true"
        @resized="
          (e) => {
            dragging = false
            leftSize = e[0].size
            middleSize = e[1].size
            rightSize = e[2].size
          }
        "
      >
        <SplitpanesPanes
          class="main-left"
          v-model:size="leftSize"
          :defaultSize="15"
          parentId="panesContainer"
          :minSizeInPixel="60"
          :dragging="dragging"
          toggle
          @toggled="reCalcuate"
        >
          <template #toggleButton>
            <SvgIcon src="/icons/file/folder.svg" />
          </template>
          <template #toggleText>
            <div class="label">{{ $t('ai.uploadText') }}</div>
          </template>
          <el-tree ref="treeRef" :data="state.fileList" default-expand-all nodeKey="id" :expand-on-click-node="false"
                   @node-click="handleNodeClick">
            <template #default="{ node, data }">
              <div :class="['flex-x-between', 'tree-item', { 'disabled-line': data.isUpload === false }]">
                <span :class="['flex-x-start', { color__danger: state.repearNameIdList.includes(data.id) }]">
                  <BrowseItemIcon :type="data.isFolder ? 'folder' : 'file'" :fileName="data.name" />
                  {{ data.name }}
                </span>
                <div class="flex-x-start" style="--icon-size: 1.14rem">
                  <!-- <el-tag v-if="Object.keys(data.aiAnalysis).length > 0" color="#FFC401" type="warning" class="mx-1" effect="dark" round >
                                  <SvgIcon src="/icons/file/ai.svg" style="--icon-color: #fff;"/>
                              </el-tag> -->
                  <SvgIcon src="/icons/menu/trash.svg" class="el-icon--right" @click.stop="handleDeleteFile(data)" />
                </div>
              </div>
            </template>
          </el-tree>
        </SplitpanesPanes>
        <SplitpanesPanes class="main-center" v-model:size="middleSize" :defaultSize="55" parentId="panesContainer"
                         :dragging="dragging" :minSizeInPixel="300">
          <div class="flex-x-between" v-show="state.selectedDoc" style="padding: var(--app-space-xs)">
            {{ state.selectedDoc.name }}
          </div>
          <div
            :class="['vformRender', { 'vform-dp-docName_color__danger': state.repearNameIdList.includes(state.selectedDoc.id) }]"
            style="padding-top: var(--app-space-xs)"
          >
            <!--                <el-button v-if="allowFeature('AI_CLASSIFICATION')" type="primary" @click="applyAllAi">{{ $t('ai.applyAll')}}</el-button>-->
            <MetaRenderForm2
              ref="MetaFormRef"
              :showOcrLanguage="state.selectedDoc.canOcr"
              :mode="allowFeature('AI_CLASSIFICATION') ? 'ai' : 'upload'"
              @formChange="handleMetaChange"
            ></MetaRenderForm2>
          </div>
        </SplitpanesPanes>
        <SplitpanesPanes
          class="main-right"
          v-model:size="rightSize"
          :defaultSize="15"
          parentId="panesContainer"
          :minSizeInPixel="60"
          :dragging="dragging"
          toggle
          @toggled="reCalcuate"
        >
          <template #toggleButton>
            <SvgIcon src="/icons/doc/file.svg" />
          </template>
          <template #toggleText>
            <div class="label">{{ $t('common_preview') }}</div>
          </template>
          <AiPreview ref="previewRef" :doc="state.selectedDoc" />
          <!--              <CollaboraViewer-->
          <!--                  v-if="state.selectedDoc.id && !state.selectedDoc.isFolder && checkExtension(state.selectedDoc.fileRelativePath) === 'collabora'"-->
          <!--                  :docId="state.selectedDoc.id" fileType="LOCAL" :readonly="true" />-->
        </SplitpanesPanes>
      </Splitpanes>
      <!--        <UploadStructurePreview class="main-right" ref="previewRef" />-->
      <div class="upload-footer flex-x-between">
        <div class="space"></div>
        <div>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="danger"
                     @click.native="handleDiscard">
            {{ $t('ai.cancelPatch') }}
          </el-button>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="info"
                     @click.native="handleClose">{{ $t('common_close') }}
          </el-button>
          <el-button v-if="state.status === 'Error'" :loading="state.retryLoading" :disabled="state.submitLoading"
                     type="primary" @click.native="handleRetry"
          >{{ $t('ai.retryAiLoading') }}
          </el-button>
          <el-button :loading="state.submitLoading" :disabled="state.retryLoading" type="primary"
                     @click.native="handleSubmit"
          >{{ $t('dpButtom_confirm') }}
          </el-button>
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { ElMessageBox, ElNotification, ElMessage } from 'element-plus'
import { emitBus, EventType } from 'eventbus'
import { newClientApi } from 'api'
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

const { status, id } = defineProps<{
  id: string
  status?: string
}>()
const routerProvider = inject(MenuRouterKey)
const userId = useUserId()
const { arrayToTree, getFileName } = useUploadAIStore()
const { t } = useI18n()
const treeRef = ref()
const MetaFormRef = ref()
const previewRef = ref()
const state = reactive<any>({
  loading: false,
  retryLoading: false,
  submitLoading: false,
  fileList: [],
  backPath: '/AIUpload',
  selectedDoc: {},
  repearNameIdList: [],
  status: status
})
const leftSize = ref(15)
const middleSize = ref(55)
const rightSize = ref(30)
const leftMin = ref(5)
const rightMin = ref(5)
const dragging = ref(false)

function reCalcuate() {
  if (leftSize.value + middleSize.value + rightSize.value < 100) {
    middleSize.value = 100 - (leftSize.value + rightSize.value)
    return
  }
  if (leftSize.value + middleSize.value + rightSize.value > 100) {
    middleSize.value = 100 - (leftSize.value + rightSize.value)
  }
}

function CalMax() {
  const el = document.getElementById('panesContainer')
  if (!el) return 10
  // get panes size and convert sizeInPixel to percentage
  const { width, height } = el.getBoundingClientRect()
  return Number(((40 / width) * 100).toFixed(0))
}

const handleMetaChange = async ({ fieldName, formModel, newValue, oldValue }: any) => {
  state.selectedDoc.properties = deepCopy(formModel)
  state.selectedDoc.fileType = formModel.documentType
  state.selectedDoc.docName = formModel.docName

  if (fieldName === 'documentType' && newValue !== oldValue && !!oldValue) {
    await MetaFormRef.value.init(state.selectedDoc.fileType, {
      isFolder: state.selectedDoc.isFolder,
      aiAnalysis: state.selectedDoc.aiAnalysis || {},
      aiDocId: state.selectedDoc.id
    })
    setTimeout(() => {
      MetaFormRef.value.setData({ ...state.selectedDoc.properties, documentType: state.selectedDoc.fileType })
    })
  }
}

function ocrPermission(doc): boolean {
  try {
    const extension = '.' + doc.name.split('.').pop()
    return !doc.isFolder && allowFeature('OCR') && canOCR(extension)
  } catch (error) {
    return false
  }
}

async function handleNodeClick(row: any) {
  if (row.id === state.selectedDoc.id) return
  state.selectedDoc = row
  state.selectedDoc.canOcr = ocrPermission(row)

  if (row.aiAnalysisDocument && !row.aiAnalysis && row.aiAnalysisDocument.metaDatas) {
    row.aiAnalysis = row.aiAnalysisDocument.metaDatas.reduce((prev: any, item: any) => {
      if (item.label || item.value) {
        prev[item.name] = {}
        if (item.label) prev[item.name].label = item.label
        if (item.value) prev[item.name].value = item.value
      }
      return prev
    }, {})
    if (!row.aiAnalysis) row.aiAnalysis = {}
    if (row.aiAnalysisDocument.documentType)
      row.aiAnalysis.documentType = {
        value: row.aiAnalysisDocument.documentType
      }
  }
  await MetaFormRef.value.init(row.fileType, {
    isFolder: row.isFolder,
    aiAnalysis: row.aiAnalysis || {},
    aiDocId: row.id
  })
  setTimeout(() => {
    if (!row.properties) row.properties = {}
    MetaFormRef.value?.setData({
      ...row.properties,
      documentType: row.fileType,
      docName: getFileName(state.selectedDoc.name, row.isFolder)
    })
  }, 100)
}

function applyAllAi() {
  const properties = {
    ...state.selectedDoc.properties,
    documentType: state.selectedDoc.fileType
    // ...state.selectedDoc.aiAnalysis.
  }
  if (state.selectedDoc.aiAnalysis) {
    Object.keys(state.selectedDoc.aiAnalysis).forEach((key) => {
      const aItem = state.selectedDoc.aiAnalysis[key]
      if (aItem.value) properties[key] = aItem.value
    })
  }
  MetaFormRef.value.setData(properties)
}

async function handleDeleteFile(data: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`, {
      confirmButtonText: t('dpButtom_confirm'),
      cancelButtonText: t('dpButtom_cancel')
    }).catch((action) => {
      return action
    })
    if (action !== 'confirm') return
    await newClientApi.deleteDmsUploadTmpFileId(data.id).then(r => r.data)
    treeRef.value.remove(data)
  } catch (error) {
    console.log(error)
  }
}

async function handleDiscard() {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToCancel')}`, {
      confirmButtonText: t('dpButtom_confirm'),
      cancelButtonText: t('common_close')
    }).catch((action) => {
      return action
    })
    if (action !== 'confirm') return
    await newClientApi.postDmsUploadCancel({ userId: userId.value, uploadId: id }).then(r => r.data)

    const item = goAiUploadDetail()
    routerProvider?.navigateTo(item)
    // router.push(state.backPath)
  } catch (error) {
    console.log(error)
  }
}

function handleClose() {
  const item = goAiUploadDetail()
  routerProvider?.navigateTo(item)
  // router.push(state.backPath)
}

function checkExtension(filename: string) {
  const ext: string = filename.split('.').pop() as string
  const collaboraList = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'jpg', 'png', 'jpeg', 'tif']
  const videoList = ['mp4']
  if (videoList.includes(ext)) {
    return 'video'
  }
  if (collaboraList.includes(ext)) {
    return 'collabora'
  }
  return 'notSupport'
}

async function handleRetry() {
  state.retryLoading = true
  try {
    const result = await newClientApi.getDmsDocumentRetryClassificationUploadid(id)
    if (!!result) {
      state.status = 'Prepare'
      routerProvider?.updateProps({
        status: 'Prepare'
      })
      await init()
    } else {
      await init()
    }
  } catch (error) {
    console.log(error)
  }
  setTimeout(() => (state.retryLoading = false), 1000)
}

async function handleSubmit() {
  const nodeMap = treeRef.value!.store.nodesMap
  const docList: any = []

  const fileConfirmDTOList = Object.keys(nodeMap).reduce((prev: any, key) => {
    const nodeItem = { ...nodeMap[key].data }
    if (!nodeItem.properties) nodeItem.properties = {}
    const properties = Object.keys(nodeItem.properties).reduce((prev: any, key) => {
      const pValue = nodeItem.properties[key]
      if (!!pValue && !['documentType', 'docName'].includes(key)) prev[key] = pValue
      return prev
    }, {})
    const extraParams: any = {}
    if (!nodeItem.isFolder) {
      const item_names = nodeItem.name.split('.')
      extraParams.fileSuffix = item_names.pop()
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
  try {
    state.submitLoading = true
    if (await checkFailedListExist(fileConfirmDTOList)) return
    const data: any = await newClientApi.postDmsUploadConfirm({
      userId: userId.value,
      uploadId: id,
      fileConfirmDTOList
    }).then(r => r.data)
    // router.back()

    if (!!data.uploadSuccess) {
      const item = goAiUploadDetail()
      routerProvider?.navigateTo(item)
      emitBus(EventType.FILE_NEED_REFRESH, {
        relatedIdOrPath: data.parentId
      })
    } else throw new Error(t('dpMsg_503'))
  } catch (error: any) {
    if (error.message) ElMessage.error(error.message)
  } finally {
    setTimeout(() => {
      state.submitLoading = false
    }, 100)
  }
}

async function checkFailedListExist(fileConfirmDTOList: any[]): Promise<boolean> {
  const checkFailedList: any = await newClientApi.postDmsUploadValidation({
    uploadId: id,
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
  }).then((res: any) => res.data.checkFailedList)
  state.repearNameIdList = []
  const fileNames = checkFailedList.reduce((prev: any, item: any) => {
    prev.push(item.docName)
    state.repearNameIdList.push(item.id)
    return prev
  }, [])
  if (checkFailedList && checkFailedList.length > 0) {
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
  return checkFailedList && checkFailedList.length > 0
}

async function init() {
  let docList: any = await newClientApi.postDmsUploadQueryItems({
    userId: userId.value,
    uploadId: id
  }).then((res) => res.data)
  console.log('docList', docList)
  docList = docList.map((item: any) => ({
    ...item,
    isFolder: item.fileType === 'Folder'
  }))
  console.log('docList', docList)
  state.fileList = arrayToTree(docList)
  if (state.fileList.length > 0) {
    setTimeout(() => {
      handleNodeClick(state.fileList[0])
      treeRef.value.setCurrentKey(state.fileList[0].id)
    }, 100)
  }
}

onMounted(async () => {
  await init()
  leftMin.value = CalMax()
  rightMin.value = CalMax()
})
</script>

<style lang="scss" scoped>
.iconContainer {
  width: 28px;
  height: 28px;
  position: relative;
  display: flex;

  img {
    width: 100%;
    height: 100%;
  }
}

.pageContainer {
  height: 100%;
  width: 100%;
  padding: var(--app-space-xs);
  position: relative;
}

.upload-main {
  display: grid;
  grid-template-rows: 1fr min-content;
  height: 100%;
  overflow: hidden;
  position: relative;
  gap: 0;

  :deep(.splitpanes__splitter) {
    width: 2px;
    background-color: var(--app-grey-950);
    position: relative;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      transition: opacity 0.4s;
      opacity: 0;
      z-index: 1;
    }

    &:hover {
      background-color: var(--primary-color);

      &:before {
        opacity: 1;
      }
    }
  }

  :deep(.splitpanes--vertical > .splitpanes__splitter:before) {
    top: 50%;
    left: -14px;
    height: 100%;
    width: 30px;
  }

  :deep(.splitpanes--horizontal > .splitpanes__splitter:before) {
    top: -30px;
    bottom: -30px;
    width: 100%;
  }

  :deep(.upload-footer) {
    border-top: 1px solid var(--app-grey-950);
    padding: var(--app-space-xs) calc(var(--app-space-xs) * 2);
  }

  :deep(.splitpanes.default-theme .splitpanes__pane) {
    background-color: var(--app-grey-0000);
  }
}

.main-left {
  :deep(.contentContainer) {
    height: calc(100% - 32px);
    overflow: auto;
  }
}

.main-center {
  :deep(.contentContainer) {
    height: 100%;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content 1fr;
    padding: var(--app-space-xs) calc(var(--app-space-xs) * 2);

    .vformRender {
      overflow: auto;
    }
  }
}

.tree-item {
  width: 100%;
  padding-right: var(--app-space-xs);
  display: flex;
  gap: var(--app-space-xs);
  overflow: hidden;
  position: relative;

  .fileName {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-tree-node-hover-bg-color);
}

.vform-dp-docName_color__danger {
  :deep(#vform-dp-docName .el-form-item__label) {
    color: #f56c6c;
  }
}

.disabled-line {
  text-decoration: line-through;
  color: var(--app-grey-950);
}

:deep(.formContainer) {
  margin: 0 var(--app-space-xs);
}

.splitpanes {
  overflow: hidden;
}
</style>
