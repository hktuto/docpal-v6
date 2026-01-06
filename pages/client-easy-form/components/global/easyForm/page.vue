<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter
          ref="ResponsiveFilterRef"
          inputKey="name"
          @form-change="handleFilterFormChange"
          inputPlaceHolder="easyForm_filter"
        />
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <EasyFormEmailDialog ref="DialogRef" />
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { routeEasyFormDetail } from '~/util/easyFormRouterHelper'

const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}

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
  id: 'a-easyForm',
  api: (pageParams: any) => {
    return clientApi.api.postDmsEasyFormPage({ ...pageParams, ...extraParams })
  },
  columns: [
    { field: 'name', title: 'easyForm.name', fixed: 'left' },
    {
      field: 'createdDate',
      title: 'easyForm_creationDate',
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
    },
    {
      field: 'status',
      title: 'easyForm_status',
      slots: {
        default: 'status'
      }
    },
    { field: 'processDefinitionKey', title: 'easyForm.submitWorkflow' }
  ],
  bodyActions: [
    [
      {
        code: 'viewDetails',
        name: t('actions.viewDetails'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'sendEmail',
        name: t('actions.sendEmail'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleSend(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function initFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'easyForm_creationDate', value: 'createdDate' },
        { label: 'easyForm.name', value: 'name' },
        { label: 'easyForm_status', value: 'enable' },
        { label: 'table_modifiedDate', value: 'modifiedDate' }
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

function handleDblclick(row: any) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeEasyFormDetail(row), false)
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const DialogRef = ref()

async function handleSend(row) {
  DialogRef.value.handleOpen(row.id)
}

onMounted(() => {
  initFilter()
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  display: flex;
  justify-content: space-between;
}

:deep(.el-input) {
  width: 200px;
}
</style>
