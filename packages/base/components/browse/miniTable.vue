<script lang="tsx" setup>
import { BrowseListProviderKey } from '#imports'
import { Grid, type VxeGridInstance, type VxeGridListeners } from 'vxe-table'

const listProvider = inject(BrowseListProviderKey)
const routerProvider = inject(MenuRouterKey)
if (!listProvider || !routerProvider) {
  throw new Error('BrowseListProviderKey not found')
}

const {
  hideColumns = ['mimeType', 'fileSize', 'documentType'],
  home,
  showCheckbox = false
} = defineProps<{
  hideColumns: any[]
  home: string
  showCheckbox: boolean
}>()

const tableContainer = ref<HTMLElement>()
const emits = defineEmits(['selectedChange'])

async function loadData(entry: any[], path?: string, pageNum: number = 0) {
  console.log('loadData', path)
  const { data } = await listProvider?.getchildApi({ idOrPath: path, pageSize: 1000, pageNum })
  entry.push(...data.entryList)
  if (data.isNextPageAvailable) {
    return loadData(entry, path, pageNum + 1)
  } else {
    return entry
  }
}

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'browseTableSetting',
  api: (pageParams: any) => loadData([], listProvider.idOrPath.value || '/'),
  columns: [
    {
      type: 'checkbox',
      fixed: 'left',
      visible: showCheckbox,
      width: 50
    },
    {
      field: 'name',
      title: 'dpTable_name',
      minWidth: 120,
      treeNode: true,
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
      title: 'search.mimeTypes',
      minWidth: 60,
      visible: hideColumns.indexOf('mimeType') === -1,
      formatter: ({ cellValue }: any) => {
        return mimeTypeToExtension(cellValue)
      }
    },
    {
      field: 'documentType',
      title: 'tableHeader_type',
      visible: hideColumns.indexOf('documentType') === -1,
      minWidth: 120
    },
    {
      field: 'fileSize',
      title: 'search.size',
      visible: hideColumns.indexOf('fileSize') === -1,

      formatter: ({ cellValue }: any) => {
        return formatFileSize(cellValue)
      }
    }
  ],
  zoom: false,
  customeToolBar: false,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false,
  dblClickAction: ({ row, column, event }) => {
    dblClickHandler(row)
  },
  bodyActions: [
    [
      {
        code: 'open',
        name: 'Open',
        action: ({ row }: any) => {
          dblClickHandler(row)
        }
      }
    ]
  ],
  permissionMethod: ({ options, column, row, rowIndex }: any) => {
    if (!row) {
      return { visible: false, disabled: false }
    }
    return {
      visible: true,
      disabled: false
    }
  },

  selectChangeHander: (selectedRows: any[]) => {
    emits('selectedChange', selectedRows)
  },
  optionalConfig: {
    treeConfig: {
      transform: true,
      rowField: 'id',
      parentField: 'parentId',
      lazy: true,
      indent: 20,
      showLine: true,
      hasChildField: 'isFolder',
      loadMethod: async (params) => {
        const entry = await loadAllChildren([], params.row.path)
        return entry
      }
    },
    checkboxConfig: {
      checkStrictly: true,
      showHeader: false,
      highlight: true,
      trigger: 'cell',
      visibleMethod: ({ row }: any) => !row.isFolder && row.source !== 'tempFile'
    },

    rowConfig: {
      height: 60,
      isCurrent: true,
      isHover: true,
      useKey: true
    }
  }
})

function dblClickHandler(row: any) {
  if (row.isFolder) {
    listProvider.changeRoute(row.id)
  } else {
    // TODO : open dialog
    const params = createDetailPageParams({
      idOrPath: row.id,
      docName: row.name
    })
    routerProvider?.navigateTo(params, true)
  }
}

async function loadAllChildren(entry: any[] = [], path?: string, pageNum: number = 0) {
  try {
    tableConfig.loading = true
    const { data } = await listProvider?.getchildApi({ idOrPath: path, pageSize: 1000, pageNum })
    entry.push(...data.entryList)
    if (data.isNextPageAvailable) {
      return loadAllChildren(entry, path, pageNum + 1)
    }
    // tableRef.value?.loadData([...tableConfig.data, ...entry])
    return entry
  } catch (error) {
    console.error(error)
    return []
  } finally {
    tableConfig.loading = false
  }
}

function changeRoute() {
  if (tableRef.value) {
    tableRef.value.commitProxy('reload')
  }
}

function selectAll() {
  if (tableRef.value) {
    tableRef.value.toggleAllCheckboxRow()
  }
}

function cleanSelected() {
  if (tableRef.value) {
    tableRef.value.setAllCheckboxRow(false)
    emits('selectedChange', [])
  }
}

watch(
  () => listProvider.idOrPath,
  () => {
    if (listProvider.idOrPath.value) {
      changeRoute()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

defineExpose({
  selectAll,
  cleanSelected,
  reload
})
</script>

<template>
  <div ref="tableContainer" class="tableContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <slot name="toolbar_buttons" />
      </template>
      <template #toolbarTools>
        <slot name="toolbarTools" />
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
.tableContainer {
  height: 100%;
  position: relative;

  &.selected {
    :deep(.vxe-buttons--wrapper) {
      border-radius: var(--app-border-radius-m);
      overflow: hidden;
      background: var(--app-grey-900);
      padding-block: var(--app-space-xs);
      --vxe-ui-layout-background-color: var(--app-grey-900);
    }
  }

  :deep(.browseFileIcon) {
    width: calc(var(--app-space-m) * 1.5);
    height: calc(var(--app-space-m) * 1.5);
  }

  :deep(.browseNameCell) {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    cursor: pointer;
  }
}
</style>
