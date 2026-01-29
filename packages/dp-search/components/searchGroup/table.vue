<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" class="tableContainer">
    <template #toolbar_buttons>
      <slot name="toolbar_buttons"></slot>
    </template>
    <template #docTags="{ row }">
      <div v-if="row?.properties && row?.properties['nxtag:tags']">
        <el-tag v-for="item in row?.properties['nxtag:tags']" :key="item.label">{{ item.label }}</el-tag>
      </div>
    </template>
    <template #logicalPath="{ row }">
      <PathTabButton :path="row.path" :fileName="row.name" :openParent="!row.is_folder" canOpen />
    </template>
    <template #contributors="{ row }">
      <div v-if="row && row.contributors">
        <el-tag v-for="item in row.contributors" :key="item">{{ item }}</el-tag>
      </div>
    </template>

    <template #summary="{ row }">
      <div v-if="row.properties && row.properties.field_summaries" v-tooltip="calculateTooltip(row)">
        {{
          (row.properties.field_summaries.name && 'File Name') ||
          (row.properties.field_summaries.path && 'path') ||
          (row.properties.field_summaries.content && 'content')
        }}
      </div>
    </template>
  </VxeGrid>
</template>
<script lang="ts" setup>
import { watchDebounced } from '@vueuse/core'
import * as mime from 'mime-types'
import { clientApi } from 'api'

const { tableId, showCheckbox } = defineProps<{
  tableId: string
  showCheckbox: boolean
}>()

const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['updateAgg', 'selectChange'])
const { t } = useI18n()
function calculateTooltip(row: any) {
  const maxWords = 10

  function trimToWords(str: string, max: number) {
    if (!str) return ''
    const words = str.split(/\s+/)
    return words.length > max ? words.slice(0, max).join(' ') + '...' : str
  }

  return `
    ${row.properties.field_summaries.name ? `File Name : ${trimToWords(row.properties.field_summaries.name, maxWords)} <br/>` : ''}
    ${row.properties.field_summaries.path ? `Path : ${trimToWords(row.properties.field_summaries.path, maxWords)} <br/>` : ''}
    ${row.properties.field_summaries.content ? `Content : ${trimToWords(row.properties.field_summaries.content, maxWords)}` : ''}
  `
}

// #region module: page
const route = useRoute()
const router = useRouter()
let pageParams = {
  pageNum: 0,
  pageSize: 20
}
const state = reactive<any>({
  expanded: true,
  loading: false,
  tableData: [],
  aggregation: {},
  options: {
    showPagination: true,
    paginationConfig: {
      total: 0,
      currentPage: 0,
      pageSize: pageParams.pageSize
    },
    sortKey: 'clientSearch',
    sortAll: true
  },
  barParams: {},
  aggParams: {}
})
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: tableId || 'search-result', // if tableId is value , use tableID to store tab ordering
  virtualScroll: false,
  api: (params: any) => {
    return getList(params)
  },
  columns: [
    {
      field: 'name',
      title: 'document_name',
      minWidth: 200,
      treeNode: false,
      type: 'html',
      formatter: ({ cellValue, row }: any) => {
        let icon = '/icons/doc/file.svg'
        if (row.is_folder) {
          icon = '/icons/doc/folder.svg'
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        // get differnent icon base on row.mimeType
        if (!row.file_content?.mime_type) {
          return `<span class="browseNameCell"><img src="${icon}" class="browseFileIcon" /> ${cellValue} ${row.source === 'tempFile' ? '(temp)' : ''}</span> `
        }
        const mimeType = row.file_content.mime_type
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
      title: 'docType_documentType',
      field: 'docpal_type',
      formatter: ({ cellValue, row }: any) => {
        if (!cellValue) return '-'
        return t(cellValue)
      }
    },
    {
      title: 'docInfo.fileExtension',
      field: 'file_suffix'
    },
    {
      title: 'searchGroup.creators',
      field: 'create_by',
      width: 120
    },
    {
      title: 'searchGroup.authors',
      field: 'contributors',
      slots: {
        default: 'contributors'
      }
    },

    {
      title: 'search.size',
      field: 'file_content.length',
      width: 120,
      formatter: ({ cellValue }: any) => {
        if (!cellValue) return '-'
        return displayFileSize(cellValue)
      }
    },
    {
      title: 'document_path',
      field: 'path',
      width: 200,
      slots: {
        default: 'logicalPath'
      }
    },
    {
      title: 'tableHeader.summary',
      field: 'properties.fieldSummaries',
      width: 200,
      slots: {
        default: 'summary'
      }
    },
    {
      title: 'tableHeader_creationDate',
      field: 'create_date',
      width: 200,
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      title: 'tableHeader_modifiedDate',
      field: 'modify_date',
      width: 200,
      formatter: ({ cellValue }: any) => {
        return formatDate(cellValue)
      }
    },
    {
      title: 'dpTable_tags',
      field: 'tags',
      width: 120,
      slots: {
        default: 'docTags'
      }
    }
  ],
  bodyActions: [],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  selectChangeHander: (selectedRows: any[]) => {
    emits('selectChange', selectedRows)
  },
  optionalConfig: {
    data: [],
    pagerConfig: {
      enabled: true,
      pageSize: state.options.paginationConfig.pageSize,
      currentPage: state.options.paginationConfig.currentPage + 1 || 1
    },
    tooltipConfig: {
      contentMethod: ({ items, row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, type, cell, $event }: any) => {
        if (!row) return ''
        const key = column.property
        const value = row[key]
        // TODO : check to send html
        if (key === 'properties.fieldSummaries') {
          return null
        }
        if (typeof value === 'string') {
          return value
        }
        if (Array.isArray(value)) {
          return value.join(',')
        }
      }
    }
  },
  optionalEvent: {
    pageChange: ({ currentPage, pageSize }: any) => {
      tableConfig.pagerConfig.currentPage = currentPage
      tableConfig.pagerConfig.pageSize = pageSize
      getList({ pageNum: currentPage - 1, pageSize })
    }
  }
})

async function getList(param: any) {
  try {
    const cleanBarParams = barParamsDecorator(state.barParams)
    if (cleanBarParams.query.length === 0) {
      state.tableData = []
      state.aggregation = {}
      return {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    }
    const res = await clientApi.api.postDmsSearchOpenSearch({ ...cleanBarParams, ...state.aggParams, ...param }).then(r => r.data)
    if (!res.page)
      res.page = {
        data: {
          entryList: [],
          totalSize: 0
        }
      }
    // const res = await SearchGroupGetApi({ ...state.barParams, ...state.aggParams, ...param })
    const list = res.page.entryList.map((item: any) => {
      const _item = { ...item }
      if (item.properties && item.properties['file_content']) {
        const mimeType = item.properties['file_content']['mime-type']
        _item.mimeType2 = mime.extension(mimeType) ? mime.extension(mimeType) : '-'
      }
      return _item
    })
    state.aggregation = res.aggregation
    state.options.paginationConfig.total = res.page.totalSize
    // tableConfig.pagerConfig.total = state.options.paginationConfig.total
    // tableConfig.pagerConfig.pageSize = param.pageSize
    // tableConfig.pagerConfig.currentPage = param.pageNum + 1

    // tableRef.value?.loadData(list)
    state.tableData = list
    let agg = { ...state.aggParams }
    if (state.barParams.filter) agg = { filter: { ...agg.filter, ...state.barParams.filter } }
    emits('updateAgg', state.aggregation, agg)
    return {
      data: {
        entryList: list,
        totalSize: res.page.totalSize
      }
    }
    // tableRef.value?.loadData(state.tableData)
  } catch (error) {
    console.error('getList error', error)
    state.tableData = []
    state.aggregation = {}
    return {
      data: {
        entryList: [],
        totalSize: 0
      }
    }
  }
}

function cleanSelected() {
  if (tableRef.value) {
    tableRef.value.setAllCheckboxRow(false)
    emits('selectedChange', [])
  }
}

// function handlePaginationChange(page: number, pageSize?: number) {
//   if (!pageSize) pageSize = pageParams.pageSize
//   const time = new Date().valueOf().toString()
//   routerProvider?.updateProps({
//     query: {
//       ...routerProvider?.tabData.value.props?.query,
//       ...pageParams,
//       pageNum: page,
//       pageSize,
//       time
//     }
//   })
//   // router.push({
//   //     query: { ...route.query, ...pageParams, pageNum:page, pageSize, time }
//   // })
// }

watchDebounced(
  () => routerProvider?.tabData,
  async () => {
    const query = routerProvider?.tabData.value.props?.query
    if (!query) return
    const { pageNum, pageSize } = query
    if (!pageNum || !pageSize) return
    // pageParams = {...newVal}
    pageParams.pageNum = Number(pageNum) - 1 > 0 ? Number(pageNum) - 1 : 0
    pageParams.pageSize = Number(pageSize) || pageParams.pageSize
    await getList(pageParams)
    // setTimeout(() => {
    //     state.firstReady = true
    // }, 100)
  },
  { debounce: 200, maxWait: 500, immediate: true, deep: true }
)

// #endregion
async function handleDblclick(row: any) {
  // TODO : update dblclick method
  const item = createDetailPageParams({
    idOrPath: row.id,
    docName: row.name,
    showHeaderAction: true
  })
  routerProvider?.navigateTo(item)
}

// function goRoute (qPath, path: string = '/browse', qPathKey: string='path') {

//   router.push({
//       path,
//       query: {
//           [qPathKey]: qPath,
//       },
//   })
// }
function initBar(searchParams: any) {
  state.barParams = searchParams
  state.aggParams = {}
  // handlePaginationChange(1)
  reload()
}

function initAgg(searchParams: any, isSearch: boolean = true) {
  state.aggParams = searchParams
  if (isSearch) reload()
}

function barParamsDecorator(barParams: any) {
  const resule = {
    query: [],
    ...barParams
  }
  if (!barParams.query) return resule
  resule.query = barParams.query.reduce((qPrev: any, qItem: any) => {
    let matchs = []
    if (qItem.matchs) matchs = qItem.matchs.filter((mItem: any) => mItem.value)
    if (matchs.length > 0) qPrev.push({ ...qItem, matchs })
    return qPrev
  }, [])

  return resule
}

function initSearch(searchParams: any) {
  state.barParams = searchParams
  reload()
}

defineExpose({ initBar, initAgg, initSearch, cleanSelected })
</script>

<style lang="scss" scoped>
.summaryItem {
  padding: var(--app-space-xs);
  background-color: var(--app-primary-color);
  margin-bottom: var(--app-space-xs);
  color: var(--app-grey-000);
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;

  b {
  }
}

.rotate {
  transition: all 1s;
}

.revert {
  transition: all 1s;
  transform: rotate(180deg);
}

.nameItem {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}

.tableContainer {
  width: 100%;
  height: 100%;
  position: relative;

  :deep(.is-dragging) {
    background: var(--app-grey-900);
    opacity: 0.5;
  }

  :deep(.dropOver) {
    // overflow: hidden;
    background: var(--app-grey-900);
    --vxe-ui-layout-background-color: var(--app-grey-900);
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
  }

  :deep(.browseNameCell) {
    display: flex;
    align-items: center;
    gap: var(--app-space-s);
    cursor: pointer;
  }
}
</style>
<style lang="scss">
.document_name {
  .vxe-cell--checkbox {
    display: flex;
  }
}
</style>
