<script lang="ts" setup>
import { newClientApi } from 'api'
import { caseManageDetailPage } from '~/utils/routerHelper'

const { t } = useI18n()
const routerProvider = inject(MenuRouterKey)
const keyword = ref()
const responsiveFilterRef = ref()

let extraParams: any = {}

const {
  tableConfig,
  tableEvent,
  tableRef,
  query,
  reload,
  cleanSelectedRows
} = useVxeTable({
  id: 'clientCaseList',
  api: async (pageParams: any) => newClientApi.postCaseTypesPage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'caseManagement.name' },
    {
      field: 'createdDate',
      title: 'workflow_createDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'modifiedDate',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  dblClickAction: ({ row }) => {
    console.log('dblClickAction', row)
    routerProvider?.navigateTo(
      caseManageDetailPage({
        name: row.name,
        id: row.id,
        data: row
      })
    )
  }
})

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
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
        { label: 'caseManagement.name', value: 'name' },
        { label: 'table_modifiedDate', value: 'modifiedDate' },
        { label: 'workflow_createDate', value: 'createdDate' }
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
  responsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>

<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="responsiveFilterRef"
          @form-change="handleFilterFormChange"
          inputKey="name"
          inputPlaceHolder="caseManagement_filter"
        />
      </template>
    </VxeGrid>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 200px;
}

</style>
