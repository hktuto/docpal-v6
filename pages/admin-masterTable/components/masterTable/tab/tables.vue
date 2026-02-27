<template>
  <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
    <template #toolbar_buttons>
      <div class="flex-x-between">
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name" inputPlaceHolder="masterTable_filter" />
        <el-button id="MasterTable__Tables__CreateNewMasterTable" class="el-icon--right button" type="primary" @click="handleAdd()">
          {{ $t('masterTable_create') }}
        </el-button>
      </div>
    </template>
    <template #status="{ row }">
      <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
      <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
    </template>
  </VxeGrid>
</template>

<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { onMounted } from 'vue'
import { MasterTableProviderKey } from '~/utils/masterTableProvider'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const emits = defineEmits(['filter-change'])
const masterTableProvider = inject(MasterTableProviderKey)
const state = reactive<any>({
  loading: false
})

const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'masterTable-tab',
  api: (pageParams: any) => masterTableProvider?.GetMasterTablesPageApi(pageParams),
  columns: [
    { field: 'name', title: 'masterTable_name', fixed: 'left' },
    { field: 'createdBy', title: 'masterTable_createdBy' },
    {
      field: 'status',
      title: 'dpTable_status',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'masterTable_edit',
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: 'masterTable_delete',
        action: ({ row }: any) => {
          handleDelete(row)
        }
      },
      {
        code: 'inactive',
        name: 'masterTable_inactivate',
        action: ({ row }: any) => {
          handleActive(row, 'D')
        }
      },
      {
        code: 'active',
        name: 'masterTable_active',
        action: ({ row }: any) => {
          handleActive(row, 'A')
        }
      }
    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    // options 是 menuConfig 中的 body 配置
    if (args.code === 'active') {
      return {
        visible: args.row.status === 'D',
        disabled: false
      }
    }
    if (args.code === 'inactive') {
      return {
        visible: args.row.status === 'A',
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

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('masterTable_deleteMsg', { name: row.name }), {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    const result = await masterTableProvider?.DeleteMasterTablesApi(row.id)
    if (!result) {
      routerProvider?.message.error(t('dpTip.deleteFailed'))
      return
    }
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: row.name }))
    query()
  } catch (error) {
    console.log(error)
  }
}

async function handleActive(row, status: 'A' | 'D') {
  state.loading = true
  try {
    row.status = status
    await masterTableProvider?.UpdateMasterTableApi({
      id: row.id,
      status
    })
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
    row.status = row.status = 'A' ? 'D' : 'A'
  }
  setTimeout(() => (state.loading = false), 500)
}

function handleDblclick(row: any) {
  console.log('handleDblclick', row)
  masterTableProvider?.openDetail(row)
}

function handleAdd() {
  masterTableProvider?.openNew()
}

// #region module: ResponsiveFilterRef
const ResponsiveFilterRef = ref()

async function getFilter() {
  const { data } = await masterTableProvider?.GetMasterTablesPageConditionApi()
  data.unshift(
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'dpTable_status', value: 'status' },
        { label: 'masterTable_createdBy', value: 'createdBy' },
        { label: 'masterTable_name', value: 'name' }
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
  )
  nextTick(() => {
    ResponsiveFilterRef.value.init(data)
  })
}

function handleFilterFormChange(formModel: any) {
  state.extraParams = formModel
  emits('filter-change', state.extraParams)
}

// #endregion

onMounted(() => {
  getFilter()
})

defineExpose({ query, reload })
</script>

<style lang="scss" scoped>
.responsive-container {
  :deep(.el-input) {
    width: 200px;
  }
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
</style>
