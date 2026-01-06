<template>
  <div class="matchingResult-container" v-loading="state.loading">
    <div class="header">
      <div class="title" :title="state.activeDoc.label">{{ state.activeDoc.label }}</div>
      <SvgIcon
        :class="{ 'refresh-loading': state.refreshLoading }"
        :content="$t('common_refresh')"
        src="/icons/file/file-refresh.svg"
        @click="refreshCabinet"
      ></SvgIcon>
    </div>
    <div v-if="state.treeData && state.treeData.length > 0" class="matchingResult-main">
      <el-tree ref="treeRef" :data="state.treeData" :props="state.defaultProps" default-expand-all :expand-on-click-node="false" @node-click="handleNodeClick">
        <template #default="{ node, data }">
          <div class="tree-item">
            <div class="ellipsis">
              <SvgIcon v-if="data.folder" src="/icons/folder-general.svg"></SvgIcon>
              <SvgIcon v-else-if="data.folder === false" src="/icons/file-general.svg"></SvgIcon>
              <span :class="getCss(data)" :title="data.label || data.title || data.name">
                {{ data.label || data.title || data.name }}
              </span>
            </div>
            <div style="--icon-size: var(--app-space-s)">
              <div v-if="showFolderError(data)" class="color__danger size12">{{ $t('msg.NoOtherFilesAllowed') }}</div>
              <div v-if="showError(data)" class="color__danger size12">{{ $t('msg.onlyOneFileAllow') }}</div>
              <SvgIcon v-if="showAddButton(data)" src="/icons/file/newFolder.svg" @click="handleAddFile(data)"></SvgIcon>
              <SvgIcon v-if="data.isDoc" src="/icons/menu/trash.svg" @click="handleDeleteFile(data)"></SvgIcon>
              <SvgIcon v-if="data.isDoc" src="/icons/eye.svg" :content="$t('common_preview')" @click="handlePreview(data)"></SvgIcon>
              <SvgIcon v-if="data.isDoc" :src="'/icons/replace.svg'" :content="$t('tip.replace')" @click="handleOpenReplaceDialog(data)" />
            </div>
          </div>
        </template>
      </el-tree>
    </div>
    <div class="flex-x-center" v-else-if="state.cabinetTemplate && state.cabinetTemplate.children && state.cabinetTemplate.children.length > 0">
      <span
        >{{ $t('fc.noDataAndInit') }}
        <el-button type="primary" text size="small" @click="handleInitFolderCabinet()">{{ $t('fc.initFolderCabinet') }}</el-button>
      </span>
    </div>
    <div class="flex-x-center" v-else>
      {{ $t('tip.cabinetNotFound') }}
    </div>
    <BrowseActionsReplaceDialog ref="BrowseActionsReplaceDialogRef" @update="refresh" />
    <FolderCabinetCreateUploadFileDialog ref="UploadFileDialogRef" @success="refresh" />
    <FolderCabinetCreateNextDialog ref="NextDialogRef" @refresh="refresh" />
  </div>
</template>

<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MenuRouterKey } from '#imports'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive<any>({
  treeData: [],
  defaultProps: {
    children: 'children',
    label: 'label'
  },
  loading: false,
  activeDoc: {}, // table选中项
  templateId: '', // tab选中项
  refreshLoading: false,

  // next
  cabinetTemplate: {},
  lastModifiedDate: ''
})
const emits = defineEmits(['refresh'])
const refreshContent = computed(() => {
  return t('table_modifiedDate') + '：' + formatDate(state.lastModifiedDate)
})

// #region module: tree
function handleNodeClick() {}

// #endregion

// #region module: init
async function init(docItem: any, templateId: string) {
  state.refreshLoading = false
  state.loading = true
  state.activeDoc = docItem
  state.templateId = templateId
  try {
    const data: any = await clientApi.api.postDmsCabinetVerificationComplete({ id: docItem.id }).then((res) => res.data)
    state.lastModifiedDate = data.modifiedDate
    if (data.children && data.children.length > 0) {
      addDocToChildren(data.children, data.documentPath)
      state.treeData = data.children
    } else {
      state.treeData = []
      state.cabinetTemplate = await clientApi.api.getDmsCabinetTemplateId(templateId).then((res) => res.data)
    }
  } catch (error) {
    state.treeData = []
  }
  state.loading = false
}

function addDocToChildren(children: any, documentPath: any, documentId: string = '') {
  if (children)
    children.forEach((item: any) => {
      let folderId = item.documents && item.documents[0] ? item.documents[0].id : ''
      addDocToChildren(item.children, item.documentPath, folderId)
      if (item.documents) {
        if (!item.children) item.children = []
        const documents = item.documents.reduce((prev: any, docItem: any) => {
          if (!docItem.isFolder) {
            docItem.isDoc = true
            prev.push(docItem)
          }
          return prev
        }, [])
        item.children.push(...documents)
      }
      if (!item.documentPath && documentPath) item.documentPath = documentPath
      if (!item.documentId && documentId) item.documentId = documentId
    })
}

// #endregion

// #region module: style
function showError(data: any) {
  if (data.folder || data.isDoc) return false
  return !data.multiple && data.children && data.children.length > 1
}

function showFolderError(data: any) {
  return data.folder && !data.complete
}

function getCss(data: any) {
  if (data.isDoc) return 'ellipsis el-icon--right'
  return data.complete ? 'ellipsis el-icon--right' : 'ellipsis color__danger el-icon--right'
}

function showAddButton(data: any) {
  return data.folder === false && !(!data.multiple && data.children && data.children.length > 0)
}

// #endregion

// #region module: actions
function refresh() {
  state.loading = true
  // 有延时
  setTimeout(async () => {
    emits('refresh')
    await init(state.activeDoc, state.templateId)

    state.loading = false
  }, 1000)
}

const treeRef = ref()
// #region module: handleAddFile
const UploadFileDialogRef = ref()

function handleAddFile(treeItem: any) {
  UploadFileDialogRef.value.handleOpen(treeItem)
}

// #endregion

async function handleDeleteFile(data: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    await clientApi.api.deleteNuxeoDocumentTrash([{ idOrPath: data.path }])
    refresh()
  } catch (error) {
    console.log(error)
  }
}

function handlePreview(row: any) {
  routerProvider?.navigateTo(
    createDetailPageParams({
      docName: row.name,
      idOrPath: row.id,
      showHeaderAction: true
    }),
    false
  )
}

const BrowseActionsReplaceDialogRef = ref()

function handleOpenReplaceDialog(doc: any) {
  BrowseActionsReplaceDialogRef.value.handleOpen(doc)
}

async function refreshCabinet() {
  if (state.refreshLoading) return
  state.refreshLoading = true
  await clientApi.api.getDmsCabinetRefreshcompletestatusId(state.activeDoc.id)
  setTimeout(() => {
    state.refreshLoading = false
    routerProvider?.message.success(t('dpMsg_success'))
    refresh()
  }, 1000)
}

// #endregion
// #region module: next
const NextDialogRef = ref()

function handleInitFolderCabinet() {
  NextDialogRef.value.handleOpen(state.cabinetTemplate, state.activeDoc.documentPath)
}

// #endregion
defineExpose({ init })
</script>

<style lang="scss" scoped>
.tree-item {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr min-content;

  & > div {
    display: flex;
    align-items: center;
    gap: calc(var(--app-space-xs) / 3);
  }
}

.size12 {
  font-size: 12px;
}

.header {
  // margin-top: 26px;
  margin: unset;
  width: calc(100% - 32px);
  display: flex;
  justify-content: space-between;
  gap: var(--app-space-xs);
  overflow: hidden;

  .title {
    line-height: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    display: block;
    font-weight: bold;
  }
}

.matchingResult-container {
  height: 100%;
  overflow: hidden;
  display: grid;
  grid-template-rows: min-content 1fr;

  .matchingResult-main {
    overflow: auto;
  }
}

.refresh-loading {
  animation: refreshLoading 1s linear infinite;
}

@keyframes refreshLoading {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.color__danger {
  color: var(--app-error-color);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
