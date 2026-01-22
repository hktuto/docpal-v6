<template>
  <div class="pageContainer--padding">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="label" @form-change="handleFilterFormChange" :inputPlaceHolder="$t('folder_cabinetFilterMsg')" />
        <el-button id="FolderCabinetSetting__CreateNewFolderCabinet" data-testid="folderCabinetConfig-new-button" type="primary" @click="handleInfo()">
          {{ $t('folderCabinet.add') }}
        </el-button>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.enable" type="success">{{ $t('actions.activated') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
      </template>
    </VxeGrid>
    <FolderCabinetSettingAddDialog ref="FolderCabinetSettingAddDialogRef" @update="handleUpdateOrCreate" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { clientApi } from 'api'
import { routeFolderCabinetDetail } from '~/utils/routerHelper'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}

function handleUpdateOrCreate({ edit, response }: any) {
  if (!edit) {
    routerProvider?.navigateTo(routeFolderCabinetDetail(response), false)
  } else {
    reload()
  }
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-folder-cabinet',
  api: (pageParams: any) => clientApi.admin.postAdmindmsCabinetTemplatePage({ ...pageParams, ...extraParams }),
  columns: [
    { field: 'label', title: 'folderCabinet.name', fixed: 'left' },
    {
      field: 'documentPath',
      title: 'folderCabinet.location'
    },
    {
      field: 'binds',
      title: 'folder_cabinetUserOrGroup',
      formatter({ row }: any) {
        if (!row.binds) return ''
        let list = []
        row.binds.forEach((bind) => {
          list.push(bind.label || bind.bindId)
        })
        return list.join(', ')
      }
    },
    {
      field: 'documentType',
      title: 'docType_documentType',
      formatter({ cellValue }: any) {
        return t(`${cellValue}`)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit_easyForm',
        name: t('folderCabinet.edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'config',
        name: t('folder_cabinetConfig'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleInfo(row)
        }
      },
      {
        code: 'delete',
        name: t('folder_cabinetDelete'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleDblclick(row)
  }
})

function handleDblclick(row) {
  // router.push(`/easyFormManage/${row.id}`);
  routerProvider?.navigateTo(routeFolderCabinetDetail(row), false)
}

const FolderCabinetSettingAddDialogRef = ref()

function handleInfo(row?: any) {
  FolderCabinetSettingAddDialogRef.value.handleOpen(row)
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(t('tip_deleteMsg', { modelName: t('menus_folderCabinet'), name: null }), {
      confirmButtonClass: 'el-button el-button--warning',
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    const result = await clientApi.api.deleteDmsCabinetId(row.id).then((res) => res.data)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') + t('menus_folderCabinet') }))
    query()
  } catch (error) {}
}

function handleFilterFormChange(formModel: any) {
  if (!formModel.isDesc) formModel.isDesc = true
  if (!!formModel.isDesc) formModel.isDesc = formModel.isDesc !== 'false'
  let filterParams: any = {
    label: formModel.label === '' ? undefined : formModel.label,
    orderBy: formModel.orderBy === undefined || formModel.orderBy === '' ? 'createdDate' : formModel.orderBy
  }
  filterParams.isDesc = formModel.isDesc
  extraParams = filterParams
  reload()
}

const ResponsiveFilterRef = ref()

async function initFilter() {
  try {
    const data = [
      {
        key: 'orderBy',
        label: 'tableHeader.sortBy',
        type: 'string',
        isMultiple: false,
        options: [
          { label: 'folderCabinet.location', value: 'documentPath' },
          { label: 'docType_documentType', value: 'documentType' },
          { label: 'folderCabinet.name', value: 'label' }
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
  } catch (error) {}
}

onMounted(() => {
  initFilter()
})
</script>
<style lang="scss" scoped>
:deep(.vxe-buttons--wrapper) {
  width: 100%;
  justify-content: space-between;

  .responsive-container {
    width: 70%;
  }
}

:deep(.el-input) {
  width: 200px;
}
</style>
