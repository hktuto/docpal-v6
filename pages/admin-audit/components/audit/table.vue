<script lang="ts" setup>
const auditProvider = inject(AuditProviderKey)
if (!auditProvider) {
  throw new Error('AuditProviderKey not found')
}
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'auditListTableSetting',
  api: (pageParams: any) => {
    const p = {
      page_size: pageParams.pageSize,
      page_num: pageParams.pageNum
    }
    return auditProvider?.getListApi({ ...p, ...extraParams })
  },
  columns: [
    {
      field: 'user_id',
      title: 'User',
      fixed: 'left'
    },
    {
      field: 'event_category',
      title: 'Category'
    },
    {
      field: 'source_id',
      title: 'Source Id'
    },
    {
      field: 'details',
      title: 'Details',
      formatter({ cellValue, row }: any) {
        return cellValue || row.event_type
      }
    },
    {
      field: 'ip_address',
      title: 'IP Address'
    },
    {
      field: 'timestamp',
      title: 'log_auditFilterDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ]
})

defineExpose({ reload, query })
const ResponsiveFilterRef = ref()
function handleFilterFormChange(formModel: any) {
  reload()
}
function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        // { label: 'category', value: 'eventCategory' },
        { label: 'log_auditFilterDate', value: 'eventDate' },
        // { label: 'log_auditEvent', value: 'label' },
        // { label: 'table_path', value: 'currentPath' },
        { label: 'User', value: 'principalName' }
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
    }
  ]
  ResponsiveFilterRef.value?.init(data)
}
// onMounted(() => {
//   getFilter()
// })
</script>

<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" />
    </template>
  </VxeGrid>
</template>
