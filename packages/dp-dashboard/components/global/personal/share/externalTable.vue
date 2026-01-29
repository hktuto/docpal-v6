<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #duration="{ row, index }">
        {{ formatDate(row.created) }} ~ {{ formatDate(row.expiredDate) }}
      </template>
    </VxeGrid>
    <ShareDialog ref="shareInfoDialogRef" @submit="handleSubmit"></ShareDialog>
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const {
  public: { endPoint }
} = useRuntimeConfig()
let extraParams: any = {}
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'd-externalShare',
  api: (pageParams: any) => getData(pageParams),
  columns: [
    { field: 'emailList', title: 'tableHeader_emailList', fixed: 'left' },
    { field: 'documentSize', title: 'tableHeader_numberOfFiles' },
    {
      field: 'expiredDate',
      title: 'search.duration',
      slots: {
        default: 'duration'
      }
    },
    {
      field: 'expiredDate',
      title: 'tableHeader_dueDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  zoom: false,
  saveColumnOrder: false
})

async function getData(params: any = {}) {
  const res = await clientApi.api.postDmsSharePage({ page: params.pageNum, size: params.pageSize, ...extraParams })
    .then((res) => res.data)
  return {
    data: {
      entryList: res?.list,
      totalSize: res?.total
    }
  }
}

const shareInfoDialogRef = ref()

function handleDblclick(row: any) {
  if (!shareInfoDialogRef?.value.handleOpen) return
  try {
    shareInfoDialogRef.value.handleOpen(row)
  } catch (error: any) {
    console.error(error)
  }
}

async function handleSubmit(shareInfo: any) {
  await clientApi.api.patchDmsShareSave(shareInfo)
  query({})
}

defineExpose({ query, reload })
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
