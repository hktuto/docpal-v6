<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
      </template>
      <template #status="{ row, rowIndex }">
        <el-tag v-if="row.status === 'ERROR'" type="danger">{{ row.status }}</el-tag>
        <el-tag v-else type="info">{{ row.status }}</el-tag>
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'message-queue',
  api: async (pageParams: any) => {
    const data = await newAdminApi.postMessageQueuePage({ ...pageParams }, extraParams)
    return {
      data: {
        entryList: data.data.content,
        totalSize: data.data.totalElements
      }
    }
  },
  columns: [
    { field: 'fileName', title: 'table_fileName', fixed: 'left' },
    { field: 'logicalPath', title: 'search.logicalPath' },
    { field: 'category', title: 'category' },
    {
      field: 'status',
      title: 'log_auditEvent',
      slots: {
        default: 'status'
      }
    },
    {
      field: 'lastUpdateDate',
      title: 'log_jobsStatus_date',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    switch (args.code) {
      case 're-try':
        return {
          visible: args.row.status === 'ERROR',
          disabled: false
        }
      default:
        return {
          visible: true,
          disabled: false
        }
    }
  }
})

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  const data = [
    /*{
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'category', value: 'category' },
        { label: 'log_auditEvent', value: 'status' },
        { label: 'table_fileName', value: 'fileName' },
        { label: 'log_jobsStatus_date', value: 'lastUpdateDate' },
        { label: 'search.logicalPath', value: 'table_path' }
      ]
    },
    {
      key: 'isDesc',
      label: 'tableHeader.sortOrder',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader.asc', value: false },
        { label: 'tableHeader.desc', value: true }
      ]
    },*/
    {
      key: 'status',
      label: 'log_auditEvent',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'CREATE', value: 'CREATE' },
        { label: 'PENDING', value: 'PENDING' },
        { label: 'COMPLETED', value: 'COMPLETED' },
        { label: 'FINISH', value: 'FINISH' },
        { label: 'ERROR', value: 'ERROR' },
        { label: 'PENDING_FOR_SENDING_MESSAGE', value: 'PENDING_FOR_SENDING_MESSAGE' }
      ]
    }
  ]
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

.responsive-container {
  width: 50%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
