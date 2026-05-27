<script setup lang="ts">
import { clientApi } from 'api'
const props = defineProps<{
  masterTableId: string
}>()

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'auditListTableSetting',
  api: (pageParams: any) => {
    const extraParams = {
      ref_id: props.masterTableId
    }
    const p = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum
    }
    return clientApi.api.postAuditLogPage({ ...p, ...extraParams })
  },
  columns: [
    {
      field: 'user_id',
      title: 'User',
      fixed: 'left',
      width: "80"
    },
    {
      field: 'event_category',
      title: 'Category'
    },
    {
      field:'source_id', title:'Source Id'
    },
    { field: 'event_type', title: 'Type' },
    {
      field: 'timestamp', title: 'log_auditFilterDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ]
})
</script>

<template>
  <div class="audit-log-root">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">

    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
.audit-log-root {
  height: 100%;
}

.audit-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-m);

  h4 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}
</style>
