<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="name" inputPlaceHolder="doc_typeSmartFolderFilter" />
        <el-button id="SmartFolderSetting__CreateNewSmartFolder" type="primary" @click="handleCreate()">
          {{ $t('doc_typeSmartFolderCreateFolder') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <SmartFolderInfoDialog ref="SmartFolderInfoDialogRef" @refresh="query()" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newAdminApi } from 'api'
import { routeSmartFolderDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
let extraParams: any = {}
const state = reactive<any>({})
const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'a-smartFolder',
  api: async (pageParams: any) => {
    return await newAdminApi.postDmsSmartFolderPage({
      ...pageParams,
      ...extraParams
    })
  },
  columns: [
    { field: 'name', title: 'doc_typeSmartFolderName', fixed: 'left' },
    { field: 'userGroups', title: 'folder_cabinetUserOrGroup' }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'doc_typeSmartFolderEdit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'info',
        name: 'doc_typeSmartFolderInfo',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleCreate(row)
        }
      },
      {
        code: 'delete',
        name: 'doc_typeSmartFolderDelete',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row.id)
        }
      }
    ]
  ],

  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  },
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})

function handleDblclick(row: any) {
  routerProvider?.navigateTo(routeSmartFolderDetail(row), false)
}

const SmartFolderInfoDialogRef = ref()

function handleCreate(setting?: any) {
  SmartFolderInfoDialogRef.value.handleOpen(setting)
}

async function handleDelete(id: string) {
  try {
    const action = await ElMessageBox.confirm(`${t('doc_typeSmartFolderDeletedMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    await newAdminApi.deleteDmsSmartFolderId(id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('file_smartFolder') }))
    query()
  } catch (error) {
    console.log(error)
  }
}

function handleFilterFormChange(formModel: any) {
  extraParams = formModel
  reload()
}

const ResponsiveFilterRef = ref()

async function getFilter() {
  const filters = await newAdminApi.getDmsSmartFolderPageConditions().then(res => res.data)
  ResponsiveFilterRef.value.init(filters)
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
  width: 70%;

  :deep(.el-input) {
    width: 200px;
  }
}
</style>
