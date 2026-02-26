<template>
  <div class="table-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent"> </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const userId: string = useUserId().value
const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'd-dashboard',
  zoom: false,
  api: (pageParams: any) => newClientApi.postDsbUserDashboardsPage({ ...pageParams, ...extraParams, userId }),
  columns: [
    { field: 'name', title: 'tableHeader_name', fixed: 'left' },
    {
      field: 'createdDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],

  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  saveColumnOrder: false
})

function handleDblclick(row: any) {
  // ElMessage.info('need navigate to dashboard detail')
  routerProvider?.navigateTo(routeDashboardDetailPage(row), false)
}

async function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'tableHeader_access', value: 'access' },
        { label: 'table_name', value: 'name' },
        { label: 'filePopover_fileCreatedDate', value: 'createdDate' }
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
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  // 因爲頁面不存在“ResponsiveFilterRef”屏蔽下面一句
  // getFilter()
})
defineExpose({ query, reload })
</script>
<style lang="scss" scoped></style>
