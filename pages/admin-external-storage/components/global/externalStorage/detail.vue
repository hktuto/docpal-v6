<template>
  <div class="pageContainer--padding externalStorage-detail">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <ResponsiveFilter ref="ResponsiveFilterRef" inputKey="name" @form-change="handleFilterFormChange" />
          <el-button id="ExternalStorage__Detail__EditConnection" type="primary" @click="handleEdit">
            {{ $t('externalStorage.editConnection') }}
          </el-button>
          <el-button id="ExternalStorage__Detail__Create" type="primary" @click="handleAdd()">
            {{ $t('externalStorage.create') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <ExternalStorageNewDialog ref="DialogRef" @refresh="getDetail()" />
    <ExternalStorageProfilesDialog ref="NewDialogRef" :id="id" @refresh="query({})" />
  </div>
</template>
<script lang="ts" setup>
import { adminApi } from 'api'
import { ElMessageBox } from 'element-plus'
import { routeExternalStorageProfileDetailPage } from '../../../util/routerHelper'

const props = defineProps(['id', 'host'])
const ResponsiveFilterRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const detail = ref({})
let extraParams: any = {
  isDesc: false
}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-external-storage-detail',
  // api: (pageParams: any) => adminApi.api.getExternalstorageIdProfilesList(props.id, { ...pageParams, ...extraParams }),
  api: (pageParams: any) => adminApi.api.postExternalstorageIdProfilesPage(props.id, { ...pageParams, ...extraParams }),
  columns: [
    { field: 'name', title: 'dpTable.name', fixed: 'left' },
    { field: 'profile_type', title: 'docType_type' },
    {
      field: 'status',
      title: 'common_status',
      slots: {
        default: 'status'
      }
    },
    {
      title: 'externalStorage.profile.sourcePath',
      field: 'importSetting.processing_folder',
      formatter({ row }: any) {
        return `${props.host}${row.import_setting?.processing_folder}`
      }
    },
    { field: 'created_by', title: 'search.createdBy' },
    {
      field: 'created_date',
      title: 'dpTable_createdDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },

    {
      field: 'modified_date',
      title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'editDetail',
        name: t('actions.editDetail'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDblclick(row)
        }
      },
      {
        code: 'active',
        name: t('actions.active'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'A')
        }
      },
      {
        code: 'inactive',
        name: t('actions.inactive'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleActive(row, 'D')
        }
      },
      {
        code: 'remove',
        name: t('common_remove'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row)
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
        visible: args.row.status === 'A',
        disabled: false
      }
    }
    if (args.code === 'active') {
      return {
        visible: args.row.status !== 'A',
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
  routerProvider?.navigateTo(routeExternalStorageProfileDetailPage({ ...row, storageId: props.id }), false)
}

async function handleActive(row: any, status: string) {
  try {
    const result = await adminApi.api.patchExternalstorageIdProfilesProfileidStatus(props.id, row.id, { status: status }).then((res) => res.data)
    if (!!result) {
      row.status = status
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

const NewDialogRef = ref()
const DialogRef = ref()

async function handleAdd() {
  NewDialogRef.value.handleOpen()
}

function handleEdit() {
  DialogRef.value.handleEdit(detail.value)
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    await adminApi.api.deleteExternalstorageIdProfilesProfileid(props.id, row.id)
    reload()
  } catch (error) {
    console.log(error)
  }
}

function getFilter() {
  const data = [
    {
      key: 'orderBy',
      label: 'tableHeader.sortBy',
      type: 'string',
      isMultiple: false,
      options: [
        { label: 'dpTable.name', value: 'name' },
        { label: 'dpTable_createdDate', value: 'createdDate' },
        { label: 'common_status', value: 'status' },
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

async function getDetail() {
  detail.value = await adminApi.api.getExternalstorageId(props.id).then((res: any) => res.data)
}

onMounted(() => {
  getFilter()
  getDetail()
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

:deep(.el-input ) {
  width: 200px;
}
</style>
