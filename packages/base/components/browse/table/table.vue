<script lang="tsx" setup>
import { useDebounceFn, useMagicKeys } from '@vueuse/core'
import { emitBus, EventType, useEventBus } from 'eventbus'
import { useSqliteTable, documentColumn, documentIndex, apiToColumn, columnToApi } from '#imports'
import type { DocumentColumnData, DocumentApiData } from '#imports'

const cleanSelectedRowsBus = useEventBus(EventType.FILE_CLEAN_SELECTED_ROWS)
const listProvider = inject(BrowseListProviderKey)
const routerProvider = inject(MenuRouterKey)
const BrowseDragMove = inject('BrowseDragMove')
const { handleDragEnd, getToolTip } = BrowseDragMove
import { newClientApi } from 'api'

if (!listProvider || !routerProvider) {
  throw new Error('BrowseListProviderKey not found')
}
const { expandedItems, mode } = defineProps<{
  expandedItems: any[]
  mode: string
}>()
const copyDocumentList = useCopyDocumnetList()
const tableContainer = ref<HTMLElement>()
const emits = defineEmits(['selectedChange', 'expandedItemsChange'])
const lastSelectedIndex = ref(-1)
const lastSelectedRow = ref<any>(null)
const docSelectedRows = ref<any[]>([])
const { shift } = useMagicKeys()
const { t } = useI18n()
// const { find, syncData } = useSqliteTable<DocumentColumnData>({
//   schema: {
//     name: 'docpal_documents',
//     columns: documentColumn,
//     indexes: documentIndex
//   },
//   hooks: {
//     afterFind: async (result: DocumentColumnData[], where: any, options: any) => {
//       const list = (await loadData([], where.parentRef)) as DocumentApiData[]

//       // step 2 calculate diff between apiList and result
//       const batchData = {
//         create: [],
//         update: [],
//         delete: []
//       } as {
//         create: DocumentColumnData[]
//         update: DocumentColumnData[]
//         delete: DocumentColumnData[]
//       }
//       // find updatd and delete items in result
//       result.forEach((item: DocumentColumnData) => {
//         if (!list.some((apiItem: DocumentApiData) => apiItem.id === item.id)) {
//           batchData.delete.push(item)
//         }
//       })
//       // find create items in list
//       list.forEach((item: DocumentApiData) => {
//         const existingItem = result.find((apiItem: DocumentColumnData) => apiItem.id === item.id)
//         if (!existingItem) {
//           batchData.create.push(apiToColumn(item))
//         } else {
//           if (item.modifiedDate !== existingItem.modifiedDate) {
//             batchData.update.push(apiToColumn(item))
//           }
//         }
//       })

//       // update table
//       tableRef.value?.insert(batchData.create.map((item) => columnToApi(item)))
//       tableRef.value?.setRow(batchData.update.map((item) => columnToApi(item)))
//       tableRef.value?.remove(batchData.delete.map((item) => columnToApi(item)))
//       syncData(batchData)
//       tableRef.value?.sort([
//         {
//           field: 'isFolder',
//           order: 'desc'
//         },
//         {
//           field: 'name',
//           order: 'asc'
//         }
//       ])
//       // sync data
//     }
//   }
// })

async function loadData(entry: any[], path?: string, pageNum: number = 0) {
  const { data } = await listProvider?.getchildApi({ idOrPath: path, pageSize: 1000, pageNum })
  data.entryList.forEach((item: any) => {
    item.parentRef = path
  })
  entry.push(...data.entryList)
  if (data.isNextPageAvailable) {
    return loadData(entry, path, pageNum + 1)
  } else {
    return entry
  }
}

function sortEntry(a: any, b: any) {
  if (a.isFolder === b.isFolder) {
    return a.name.localeCompare(b.name)
  }
  return b.isFolder ? 1 : -1
}

function recursiveLoadChild(checkList: any[] = [], treeData: any[], result: any[] = []) {
  checkList.forEach((row, index) => {
    const rowData = treeData.find((el) => el.id === row)
    if (rowData) {
      if (!tableRef.value?.isTreeExpandByRow(rowData)) {
        result.push(rowData)
      } else {
        result = recursiveLoadChild(checkList, rowData.children, result)
      }
    }
  })
  return result
}

// DEPRECATED: now system use sqlite to store expanded items, so this function is not needed
const reopenFolder = useDebounceFn(() => {
  console.log('reopenFolder', expandedItems)
  if (!tableRef.value || expandedItems.length === 0) return
  const { fullData } = tableRef.value.getTableData()
  console.log('tableData', fullData)
  let needExpandList: any[] = recursiveLoadChild(expandedItems, fullData, [])
  console.log('needExpandList', needExpandList)
  tableRef.value?.setTreeExpand(needExpandList, true)
  // get table opened row
}, 300)
const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'browseTableSetting',
  api: async (pageParams: any) => {
    cleanSelectedRows()
    // if mode is browse, use loadData to get current path data
    if (listProvider.mode.value === 'browse') {
      const list = (await loadData([], listProvider.idOrPath?.value || '/')) as DocumentApiData[]
      // const data = await find({
      //   parentRef: listProvider.idOrPath?.value || '/'
      // }).then((data) => {
      //   return data.map((item) => columnToApi(item))
      // })
      if (list) {
        list.sort(sortEntry)
        emits('selectedChange', [])
        return list
      }
      return []
    }
    // if mode is search, use searchData to get search data
    if (listProvider.mode.value === 'search') {
      // TODO : IMPLEMENT SEARCH DATA
      return []
    }
  },
  childChangeHandler: () => {
    // DEPRECATED: now system use sqlite to store expanded items, so this function is not needed
    reopenFolder()
  },
  columns: [
    {
      type: 'checkbox',
      fixed: 'left',
      width: 50
    },
    {
      field: 'name',
      title: 'document_name',
      minWidth: 200,
      treeNode: true,
      dragSort: true,
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        if (row.isFolder) {
          icon = '/icons/doc/folder.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        // get differnent icon base on row.mimeType
        if (!row.mimeType) {
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        const mimeType = row.mimeType
        if (mimeType?.startsWith('image')) {
          icon = '/icons/doc/image.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('video')) {
          icon = '/icons/doc/video.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('audio')) {
          icon = '/icons/doc/audio.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('application/pdf')) {
          icon = '/icons/doc/pdf.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('text')) {
          icon = '/icons/doc/text.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('application/zip')) {
          icon = '/icons/doc/zip.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('application/vnd.ms-excel') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
          icon = '/icons/doc/excel.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        if (mimeType?.startsWith('application/msword') || mimeType?.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
          icon = `/icons/doc/word.svg`
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        // if mimetype is ppt, return ppt src
        if (
          mimeType?.startsWith('application/vnd.ms-powerpoint') ||
          mimeType?.startsWith('application/vnd.openxmlformats-officedocument.presentationml.presentation')
        ) {
          icon = `/icons/doc/ppt.svg`
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
      }
    },
    {
      field: 'mimeType',
      title: 'search.mimeType',
      formatter: ({ cellValue }: any) => {
        return mimeTypeToExtension(cellValue)
      }
    },
    {
      field: 'documentType',
      title: 'docType_documentType'
    },
    {
      field: 'fileSize',
      title: 'search.size',
      formatter: ({ cellValue }: any) => {
        return formatFileSize(cellValue)
      }
    },
    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      field: 'createdDate',
      title: 'dpTable_createdDate',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      field: 'fileModifiedDate',
      title: 'fileModifiedDate_label',
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      field: 'tags',
      title: 'rightDetail_tags',
      slots: {
        default: 'tags'
      }
    },
    {
      field: 'contributors',
      title: 'info_contributors'
    }
  ],
  customeToolBar: true,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  dblClickAction: ({ row, column, event }) => {
    dblClickHandler(row)
  },
  bodyActions: [
    [
      {
        code: 'docOpen',
        name: 'common_open',
        action: ({ row }: any) => {
          dblClickHandler(row)
        }
      },
      {
        code: 'docPreview',
        name: 'common_preview',
        action: ({ row }: any) => {
          if (row.isFolder) return
          emitBus(EventType.FILE_PREVIEW_OPEN, row)
        }
      },
      {
        code: 'docActionAddFolder',
        name: 'filePopover_newFolder',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          const ev = new CustomEvent('docActionAddFolder', { detail: doc })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionNewFile',
        name: 'filePopover_newFile',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          const ev = new CustomEvent('docActionNewFile', { detail: doc })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionUploadFile',
        name: 'filePopover_uploadFile',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          const ev = new CustomEvent('docActionUploadFile', { detail: doc })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionUploadFolder',
        name: 'filePopover_uploadFolder',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          const ev = new CustomEvent('docActionUploadFolder', { detail: doc })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionRename',
        name: 'filePopover_rename',
        action: ({ row }) => {
          const ev = new CustomEvent('docActionRename', { detail: row })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionChangeDocType',
        name: 'filePopover_changeDocType',
        action: ({ row }) => {
          const ev = new CustomEvent('docActionChangeDocType', { detail: row })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docWatermark',
        name: 'filePopover_watermark',
        action: async ({ row }) => {
          const detail = await newClientApi.postDmsDocumentFetch({ idOrPath: row.id }).then((res) => res.data)
          const ev = new CustomEvent('docWatermark', { detail: detail })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionCopy',
        name: 'filePopover_copy',
        action: ({ row }) => {
          const ev = new CustomEvent('docActionCopy', { detail: row })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionCut',
        name: 'filePopover_cut',
        action: ({ row }) => {
          const ev = new CustomEvent('docActionCut', { detail: row })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionPaste',
        name: 'filePopover_paste',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          const ev = new CustomEvent('docActionPaste', { detail: doc })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'assignPermission',
        name: 'filePopover_internalShare',
        action: ({ row }) => {
          const ev = new CustomEvent('docActionInternalShare', { detail: row })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionDelete',
        name: 'filePopover_delete',
        action: async ({ row }) => {
          const detail = await newClientApi.postDmsDocumentFetch({ idOrPath: row.id }).then((res) => res.data)
          const ev = new CustomEvent('docActionDelete', { detail: detail })
          document.dispatchEvent(ev)
        }
      },
      {
        code: 'docActionRefresh',
        name: 'common_refresh',
        action: ({ row }) => {
          const doc = row || listProvider.docDetail?.value
          reload()
        }
      },
      {
        code: 'docActionNewTab',
        name: 'rightClick.newTab',
        action: ({ row }) => {
          if (row.source === 'tempFile') {
            const newItem = createAiUploadDetail({
              id: row.doc.uploadId
            })
            routerProvider?.navigateTo(newItem, true)
            return
          }
          if (row.isFolder) {
            const link = createBrowseListPageParams({
              idOrPath: row.id
            })
            routerProvider?.navigateTo(link, true)
            return
          }
          const detailLink = createDetailPageParams({
            idOrPath: row.id,
            docName: row.name,
            showHeaderAction: true
          })
          routerProvider?.navigateTo(detailLink, true)
        }
      },
      {
        code: 'download',
        name: 'rightClick.download',
        action: ({ row }) => {
          downloadHandler(row)
        }
      }
    ]
  ],
  asyncPermission: async ({ row }: any) => {
    const clickItem = row || listProvider.docDetail?.value
    const permissionCodes = {
      docPreview: RbacPermission.read,
      docActionAddFolder: RbacPermission.createSubFolder,
      docActionNewFile: RbacPermission.create,
      docActionUploadFile: RbacPermission.create,
      docActionUploadFolder: RbacPermission.createSubFolder,
      docActionRename: RbacPermission.write,
      docActionChangeDocType: RbacPermission.write,
      docWatermark: RbacPermission.write,
      docActionCopy: RbacPermission.write,
      docActionCut: RbacPermission.delete,
      docActionPaste: RbacPermission.createSubFolder,
      assignPermission: RbacPermission.assignPermission,
      docActionDelete: RbacPermission.delete,
      download: RbacPermission.download
    }
    const result = {
      showBlank: true,
      docOpen: {
        visible: !!row,
        disabled: false
      }
    }
    Object.keys(permissionCodes).forEach((key) => {
      const code = permissionCodes[key]
      console.log(123,code)
      if (row.comeFrom === 'google_drive') {
        result[key] = {
          visible: false,
          disabled: false
        }
        return
      }
      if (!clickItem || clickItem.path === '/') {
        result[key] = {
          visible: false,
          disabled: false
        }
        return
      }
      let hold = {}
      if (clickItem.hold) {
        hold = typeof clickItem.hold === 'string' ? JSON.parse(clickItem.hold) || {} : clickItem.hold
      }
      const visible = RbacAllowTo(code, { ...clickItem, hold }, clickItem.isFolder)
      switch (key) {
        case 'docActionPaste':
          const isPaste = key === 'docActionPaste' ? copyDocumentList.value.length > 0 : 1
          result[key] = {
            visible: visible && isPaste,
            disabled: false
          }
          break
        case 'docPreview':
        case 'docWatermark':
          result[key] = {
            visible: visible && !clickItem.isFolder,
            disabled: false
          }
          break
        default:
          result[key] = {
            visible: visible,
            disabled: false
          }
          break
      }
    })
    return result
  },
  selectChangeHander: (selectedRows: any[], selectedRow: any) => {
    // check if selectedRows is not Folder
    if (selectedRows.length === 0) {
      emits('selectedChange', [])
      return
    }
    const resultSelectedRows = handleCheckboxChange(selectedRows, selectedRow)
    docSelectedRows.value = resultSelectedRows
    emits('selectedChange', resultSelectedRows)
  },
  optionalConfig: {
    treeConfig: {
      transform: true,
      parentField: 'parentRef',
      lazy: true,
      indent: 20,
      showLine: true,
      hasChildField: 'isFolder',
      loadMethod: async (params) => {
        try {
          const apiData = (await loadData([], params.row.id)) as DocumentApiData[]
          return apiData.sort(sortEntry)
        } catch (e) {
          // if error, return empty array and remove item from expandedItems
          console.error(e)
          return []
        }
      }
    },
    checkboxConfig: {
      checkStrictly: true,
      showHeader: false,
      highlight: true,
      trigger: 'cell',
      visibleMethod: ({ row }: any) => row.source !== 'tempFile'
    },
    rowConfig: {
      height: 42,
      isCurrent: true,
      isHover: true,
      useKey: true,
      keyField: 'id',
      drag: true
    },
    rowDragConfig: {
      trigger: 'cell',
      isPeerDrag: true,
      isCrossDrag: true,
      showGuidesStatus: true,
      tooltipMethod({ row }) {
        return getToolTip(row)
      },
      async dragEndMethod(data: any) {
        handleDragEnd(data)
        return false
      }
    },
    cellClassName: ({ rowIndex, row }) => {
      if (row.source === 'tempFile') {
        return 'temp-file'
      }
    }
  },
  optionalEvent: {
    toggleTreeExpand: ({ expanded, row }) => {
      if (expanded) {
        // check if item exist in expandedItems
        if (expandedItems.includes(row.id)) return
        expandedItems.push(row.id)
        console.log('expandedItems', expandedItems)
        emits('expandedItemsChange', expandedItems)
      } else {
        const index = expandedItems.findIndex((ex) => ex === row.id)
        if (index !== -1) expandedItems.splice(index, 1)
        emits('expandedItemsChange', expandedItems)
      }
    },
    cellMouseleave: ({ row, column, rowIndex }) => {
      emitBus(EventType.FILE_PREVIEW_CLOSE, row)
    }
  }
})

const { dropEvent } = useBrowseDrop(tableRef, tableContainer, listProvider.docDetail)
cleanSelectedRowsBus.on(cleanSelectedRows)

function dblClickHandler(row: any) {
  if (row.source === 'tempFile') {
    const newItem = createAiUploadDetail({
      id: row.uploadId
    })
    routerProvider?.navigateTo(newItem, true)
    return
  }
  if (row.isFolder) {
    listProvider?.changeRoute(row.id)
  } else {
    const params = createDetailPageParams({
      idOrPath: row.id,
      docName: row.name
    })
    routerProvider?.navigateTo(params)
  }
}

async function loadAllChildren(entry: any[] = [], id?: string, pageNum: number = 0) {
  const { data } = await listProvider?.getchildApi({ idOrPath: id, pageSize: 1000, pageNum })
  data.entryList.forEach((item: any) => {
    item.parentRef = id
  })
  entry.push(...data.entryList)
  if (data.isNextPageAvailable) {
    return loadAllChildren(entry, id, pageNum + 1)
  }
  // tableRef.value?.loadData([...tableConfig.data, ...entry])
  return entry
}

function changeRoute() {
  if (tableRef.value) {
    tableRef.value.commitProxy('reload')
  }
}

function selectAll() {
  if (tableRef.value) {
    tableRef.value.setAllCheckboxRow(true)
  }
}

function cleanSelected() {
  if (tableRef.value) {
    cleanSelectedRows()
    emits('selectedChange', [])
  }
}

onDeactivated(() => {
  emitBus(EventType.FILE_PREVIEW_CLOSE)

  cleanSelectedRowsBus.off(cleanSelectedRows)
})
onUnmounted(() => {
  emitBus(EventType.FILE_PREVIEW_CLOSE)

  cleanSelectedRowsBus.off(cleanSelectedRows)
})

watch(
  () => listProvider.idOrPath,
  () => {
    if (listProvider?.idOrPath?.value) {
      changeRoute()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

// watch mode in listProvider, if mode change then reload table
watch(
  () => listProvider.mode,
  () => {
    if (tableRef.value) {
      tableRef.value.reload()
    }
  }
)

function handleCheckboxChange(rows: any, selectedRow: any) {
  if (
    shift.value &&
    lastSelectedIndex.value !== -1 &&
    selectedRow.rowIndex !== lastSelectedIndex.value &&
    lastSelectedRow.value.parentRef === selectedRow.row.parentRef
  ) {
    const allData = tableRef.value?.getData() || []
    const cItem = findNodeById({ children: allData }, selectedRow.row.parentRef)
    const startIndex = Math.min(lastSelectedIndex.value, selectedRow.rowIndex)
    const endIndex = Math.max(lastSelectedIndex.value, selectedRow.rowIndex)

    for (let i = startIndex; i <= endIndex; i++) {
      const currentRow = cItem.children[i]
      if (currentRow && !currentRow.isFolder && currentRow.source !== 'tempFile') {
        tableRef.value?.setCheckboxRow(currentRow, selectedRow.checked)
      }
    }
  }

  lastSelectedIndex.value = selectedRow.rowIndex
  lastSelectedRow.value = selectedRow.row
  const selectedRows = tableRef.value?.getCheckboxRecords() || []
  return selectedRows

  function findNodeById(node: any, targetId) {
    if (node.id === targetId) {
      return node
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const found = findNodeById(child, targetId)
        if (found) {
          return found
        }
      }
    }
    return null
  }
}

defineExpose({
  selectAll,
  cleanSelected,
  reload,
  tableRef,
  tableConfig,
  loadAllChildren
})
</script>

<template>
  <div ref="tableContainer" class="tableContainer" @dragover.prevent="dropEvent.dragover" @drop="dropEvent.drop">
    <VxeGrid v-show="mode === 'browse'" ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <slot name="toolbar_buttons" />
      </template>
      <template #toolbarTools>
        <slot name="toolbarTools" />
      </template>
      <template #tags="{ row, index }">
        <el-tag class="el-icon--left table-tag" v-for="item in row.tags">
          {{ item }}
        </el-tag>
      </template>
    </VxeGrid>
    <BrowseTableSearch v-show="mode === 'search'" :mode="mode" />
  </div>
</template>

<style lang="scss" scoped>
.tableContainer {
  width: 100%;
  height: 100%;
  position: relative;
  :deep(.is-dragging) {
    background: var(--app-grey-900);
    opacity: 0.5;
  }
  &.drop-row {
    border: 3px dashed var(--app-grey-900);
  }
  &.selected {
    :deep(.vxe-buttons--wrapper) {
      border-radius: var(--app-border-radius-m);
      // overflow: hidden;
      background: var(--app-grey-900);
      padding-block: var(--app-space-xs);
      --vxe-ui-layout-background-color: var(--app-grey-900);
    }
  }

  :deep(.browseFileIcon) {
    width: calc(var(--app-space-m) * 1.5);
    height: calc(var(--app-space-m) * 1.5);
    -webkit-user-drag: none; /* Safari */
    -khtml-user-drag: none; /* Konqueror HTML */
    -moz-user-drag: none; /* Firefox */
    -o-user-drag: none; /* Opera */
    user-drag: none; /* Non-prefixed version, currently supported by Chrome */
  }
  :deep(.vxe-cell--drag-handle) {
    display: none;
  }
  :deep(.browseNameCell) {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    cursor: pointer;
  }
  :deep(.drop-row td) {
    background-color: var(--app-grey-900) !important;
  }
  :deep(.drop-row-disabled td) {
    // cursor: not-allowed;
    // background-color: green !important;
  }
  :deep(.vxe-table--drag-wrapper) {
    // display: none !important; // delete bottom border when drag
    .is--guides {
      background-color: unset;
      border: none;
    }
  }
  :deep(.vxe-cell--html) {
    display: flex;
    align-items: center;
  }
}
</style>
