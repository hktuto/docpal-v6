<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <!-- <template #status="{row, rowIndex}">
      <el-tag v-if="row.status === 'ERROR'" type="danger">{{ row.status }}</el-tag>
      <el-tag v-else type="info">{{ row.status }}</el-tag>
    </template> -->
  </VxeGrid>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'

let extraParams: any = {}
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'whapps-log',
  api: async (pageParams: any) => {
    return await clientApi.admin.postAdminext3rdmessageWhatsappLogsQuery({ ...pageParams }, extraParams)
  },
  columns: [
    {
      field: 'createdDate',
      title: 'dpTable_createdDate',
      fixed: 'left',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'responseMessage', title: 'dpTable_message' },
    {
      field: 'status', title: 'dpTable_status'
      // slots: {
      //   default: 'status'
      // } 
    }
  ],
  saveColumnOrder: false
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
