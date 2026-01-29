<template>
  <div class="pageContainer--padding collection-container">
    <div :class="['collection-container--left', { collapse: style.collapse }]">
      <div class="flex-x-end">
        <el-button id="Collection_CreateNewCollection" type="primary" @click="openAddCollectionDialog">
          {{ t('collections_new') }}
        </el-button>
        <el-icon :class="['collapse-icon', 'el-icon--right', style.collapse ? 'rotate' : 'revert']"
                 @click="handleCollapse">
          <ArrowDownBold />
        </el-icon>
      </div>
      <div class="collection-list" style="--color: #f56c6c">
        <div
          v-for="item in state.collectionList"
          :key="item.id"
          :class="['collection-item', 'cursorPointer', { current: state.curCollection.id === item.id }]"
          @click="handleTabClick(item)"
        >
          <span class="ellipsis" :title="item.name">{{ item.name }}</span>
          <el-icon :id="`Collection__Delete_${item.name}`" class="color__danger__hover cursorPointer"
                   @click.stop="handleDelete(item)">
            <Delete />
          </el-icon>
        </div>
      </div>
    </div>
    <div class="collection-main">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <div class="flex-x-between">
            <div class="title">{{ state.curCollection.name }}</div>
            <SvgIcon id="Collection__EditCollectionInfo" src="/icons/edit.svg" class="el-icon--right el-icon--left"
                     @click="openEditCollectionDialog" />
          </div>
          <div class="flex-x-end">
            <template v-if="state">
              <SvgIcon v-if="state.tableData && state.tableData.length > 0" src="/icons/file/share.svg"
                       round :content="t('tip.addToShare')" @click="handleShare" />
            </template>
            <SvgIcon id="shareToQueue" src="/icons/file/share.svg" round></SvgIcon>
          </div>
        </template>
      </VxeGrid>
    </div>

    <LazyCollectionAddCollectionDialog ref="addCollectionDialog" @success="handleAddCollection" />
    <LazyCollectionEditCollectionDialog ref="editCollectionDialog" @refresh="reloadCollection" />
  </div>
</template>

<script setup lang="ts">
import { clientApi } from 'api'
import anime from 'animejs'
import { ElMessageBox } from 'element-plus'
import { createBrowseListPageParams, createDetailPageParams } from '~/utils/browseMenuHelper'
import { ArrowDownBold, Delete } from '@element-plus/icons-vue'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const route = useRoute()
const pageParams = {
  pageIndex: 0,
  pageSize: 20
}
type TableState = {
  loading: boolean
  tableData: any[]
  options: {
    showPagination: boolean
    paginationConfig: {
      total: number
      currentPage: number
      pageSize: number
    }
  }
  collectionList: any
  curCollection: any
  selectedDocs: any[]
}

const state = reactive<TableState>({
  loading: false,
  tableData: [],
  options: {
    showPagination: true,
    paginationConfig: {
      total: 0,
      currentPage: 1,
      pageSize: pageParams.pageSize
    }
  },
  collectionList: [],
  curCollection: '',
  selectedDocs: []
})

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'clientCollectionsList',
  api: async (pageParams: any) => {
    let id = state.curCollection.id
    const {
      data: { entryList }
    }: any = await clientApi.api.postDmsCollectionDocumentsQuery({ idOrPath: id })
    state.tableData = entryList
    return entryList
  },
  columns: [
    {
      field: 'name',
      title: 'tableHeader.fileOrFolderName',
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        if (row.isFolder) {
          icon = '/icons/doc/folder.svg'
        }
        return `<span class="tableRow-icon-cell"><img src="${icon}" /> ${cellValue}</span>`
      }
    },
    { field: 'path', title: 'document_path' },
    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'type', title: 'table_type' }
  ],
  bodyActions: [
    [
      {
        code: 'deleted',
        name: 'collection_remove',
        action: ({ row }: any) => {
          handleDocDelete(row)
        }
      }
    ]
  ],
  permissionMethod: ({ options, column, row, rowIndex }: any) => {
    if (!row) {
      return {
        visible: false,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  virtualScroll: true,
  dblClickAction: ({ row }) => {
    let newItem
    if (row.isFolder) {
      newItem = createBrowseListPageParams({
        idOrPath: row.id
      })
    } else {
      newItem = createDetailPageParams({
        idOrPath: row.id,
        docName: row.name,
        showHeaderAction: true
      })
    }
    routerProvider?.navigateTo(newItem)
  },
  selectChangeHander: (selectedRows: any[]) => {
    state.selectedDocs = [...selectedRows]
  }
})

function reloadPage() {
  reload()
  getCollectionList()
}

async function getCollectionList() {
  const data: any = await clientApi.api.getDmsCollection().then(r => r.data)
  try {
    state.collectionList = data.entryList
    if (state.collectionList.length > 0) {
      let index = state.collectionList.findIndex((item: any) => item.id === route.query.tab)
      if (index === -1) index = 0
      handleTabClick(state.collectionList[index])
    }
    reload()
  } catch (error) {
    console.log(error)
  }
}

function handleAddCollection(data: any) {
  state.collectionList.push(data)
}

function handleTabClick(row: any) {
  state.curCollection = row
  reload()
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('collection_deleteMsg', { name: row.name }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    }).catch(() => {
      return
    })
    if (action !== 'confirm') return
    await clientApi.api.deleteDmsCollectionCollectionid(row.id).then(r => r.data)
    routerProvider?.message.success(t('collection_deleteSuccessMsg', { name: row.name }))
    reloadPage()
  } catch (error) {
    console.log(error)
  }
}

function handleDocDelete(row: any) {
  let docList = []
  docList.push({ idOrPath: row.id })
  const param = {
    documents: docList,
    collection: { idOrPath: state.curCollection.id }
  }
  ElMessageBox.confirm(t('collectionFile_deleteMsg', { name: state.curCollection.name }), {
    confirmButtonClass: 'el-button el-button--warning',
    confirmButtonText: t('common_confirmDelete')
  }).then(async () => {
    state.loading = true
    try {
      await clientApi.api.postDmsCollectionDocumentsRemove(param).then(r => r.data)
      setTimeout(() => {
        query({})
      }, 1000)
      routerProvider?.message.success(t('collectionFile_deleteSuccessMsg', { name: state.curCollection.name }))
      reload()
    } catch (error) {
    }
    state.loading = false
  })
}

const addCollectionDialog = ref()
const editCollectionDialog = ref()

function openAddCollectionDialog() {
  addCollectionDialog.value.handleOpen()
}

function openEditCollectionDialog() {
  editCollectionDialog.value.handleOpen(state.curCollection)
}

const style = reactive({
  collapse: true
})

function handleCollapse() {
  style.collapse = !style.collapse
}

const { addToShareList } = useShareStore()

async function handleShare() {
  const data: any = await clientApi.api.postDmsCollectionDocumentsThumbnails({ idOrPath: state.curCollection.id }).then((res: any) => res.data.entryList)
  // TODO 未調試
  addToShareList(data)

  nextTick(() => {
    const shareDraggableButton = document.getElementById('share-draggable-button')
    const shareToQueue = document.getElementById('shareToQueue')
    if (!shareToQueue) return
    shareToQueue.style.transform = 'none'
    shareToQueue.style.display = 'block'
    if (shareDraggableButton) {
      anime({
        targets: '#shareToQueue',
        translateX: shareDraggableButton.getBoundingClientRect().left - shareToQueue.getBoundingClientRect().left,
        translateY: shareDraggableButton.offsetTop - shareToQueue.offsetTop - 60,
        duration: 750,
        easing: 'easeInOutQuad'
      })
    }
    setTimeout(() => {
      shareToQueue.style.display = 'none'
    }, 750)
  })
}

function reloadCollection() {
  let data = editCollectionDialog.value.getData()
  state.curCollection.name = data.name
  state.collectionList.find((item) => {
    if (item.id === data.id) {
      item.name = data.name
    }
  })
  reload()
}

onMounted(() => {
  getCollectionList()
})
</script>

<style scoped lang="scss">
.current {
  background-color: var(--menu-selected-bg);
  color: var(--menu-selected-color);
}

.el-container {
  height: 100%;
  overflow: hidden;
}

.flex-x-end {
  display: flex;
  justify-content: flex-end;
}

.title {
  font-size: var(--app-font-size-xl);
  font-weight: 600;
  margin-right: var(--app-space-xs);
}

.collection-container {
  display: grid;
  grid-template-columns: min-content 1fr;
  gap: var(--app-space-xs);

  &--left {
    width: 200px;
    display: grid;
    grid-template-rows: min-content 1fr;
    height: 100%;
    overflow: hidden;
    gap: var(--app-space-xs);
    border-right: 1px solid #ddd;
    // box-shadow: 0 0 12px rgba(0,0,0,.12);
    padding-right: var(--app-space-xs);

    .collection-list {
      overflow: auto;
    }

    .collection-item {
      padding: var(--app-space-xs);
      display: grid;
      grid-template-columns: 1fr min-content;
      gap: var(--app-space-xs);
    }

    .collapse-icon {
      display: none;
    }
  }
}

.collection-main {
  overflow: hidden;
}

.rotate {
  transition: all 1s;
}

.revert {
  transition: all 1s;
  transform: rotate(180deg);
}

@media (max-width: 1024px) {
  .collection-container {
    grid-template-columns: unset;
    grid-template-rows: min-content 1fr;
    width: 100%;

    &--left.collapse {
      height: 35px;
      width: 100%;
      box-shadow: unset;
    }

    &--left {
      height: 50vh;
      width: 100%;
      padding-right: unset;
      // box-shadow:  -1px 0px 3px rgba(0, 0, 0, .12);
    }

    .collection-list {
      display: grid;
      grid-template-columns: 1fr 1fr;

      .collection-item {
        background-color: #ecf5ff;
        color: #409eff;
        display: grid;
        grid-template-columns: 1fr min-content;
        gap: var(--app-space-xs);
        align-items: center;
        vertical-align: middle;
        padding: 3px 9px;
        margin: 4px 4px;
        border-radius: 4px;
      }

      .current {
        background-color: aquamarine;
      }
    }

    .collapse-icon {
      display: unset;
    }
  }
}

#shareToQueue {
  z-index: 100;
  display: none;
}
</style>
