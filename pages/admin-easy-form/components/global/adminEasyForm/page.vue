<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" inputPlaceHolder="easyForm_filter" />
          <el-button id="EasyForm__CreateNewForm" type="primary" @click="handleAdd()">
            {{ $t('easyForm_createForm') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <EasyFormNewDialog ref="DialogRef" @refresh="query({})" />
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
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-easyForm',
  api: (pageParams: any) => clientApi.admin.postAdmindmsEasyFormPage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'easyForm.name', fixed: 'left', type: 'checkbox' },
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
        code: 'edit_easyForm',
        name: t('easyForm_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'active',
        name: t('easyForm_activate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, true)
        }
      },
      {
        code: 'inactive',
        name: t('easyForm_inactivate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, false)
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    if (args.code === 'inactive') {
      return {
        visible: args.row.enable,
        disabled: false
      }
    }
    if (args.code === 'active') {
      return {
        visible: !args.row.enable,
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row: any) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeEasyFormDetail(row), false)
}

async function handleActive(row: any, isActive: boolean) {
  try {
    const type = isActive ? 'patchAdmindmsEasyFormEnableId' : 'patchAdmindmsEasyFormDisableId'
    const result = await clientApi.api[type](row.id).then((res) => res.data)
    if (!!result) {
      row.enable = isActive
    }
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  extraParams = formModel
  reload()
}

const DialogRef = ref()

async function handleAdd() {
  DialogRef.value.handleOpen()
}

function getFilter() {
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
  ResponsiveFilterRef.value.init(data)
}

onMounted(() => {
  getFilter()
})
</script>
<style lang="scss" scoped>
.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-start;
  --icon-size: var(--app-font-size-m);
}

:deep(.el-input) {
  width: 200px;
}
</style>
