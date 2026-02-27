<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef"
                          @form-change="handleFilterFormChange"
                          inputKey="name"
                          inputPlaceHolder="dashboard_filter"
        />
      </template>
    </VxeGrid>
  </div>
</template>
<script lang="ts" setup>
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)

const userId:string = useUserId().value
const { t } = useI18n()
let extraParams: any = {}
const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'c-dashboard',
  api: (pageParams: any) => newClientApi.postDsbUserDashboardsPage({ ...pageParams, ...extraParams, userId }),
  columns: [
    { field: 'name', title: 'dashboard_name', fixed: 'left' },
    {
      field: 'createdDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'preview',
        name: t('dashboard_preview'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeDashboardDetailPage(row))
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'dashboard_name', value: 'name' },
        { label: 'workflow_createDate', value: 'createdDate' },
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

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}
</style>
