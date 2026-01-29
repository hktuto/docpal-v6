<template>
  <div class="outputTable-container">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actions">
          <el-button id="new" type="primary" @click="handleOpen()">
            {{ $t('common_new') }}
          </el-button>
        </div>
      </template>
      <template #status="{ row }">
        <el-tag v-if="row.status === 'A'" type="success">{{ $t('actions.active') }}</el-tag>
        <el-tag v-else type="danger">{{ $t('Deactivated') }}</el-tag>
      </template>
    </VxeGrid>
    <ExternalStorageProfilesOutputDialog ref="DialogRef" v-bind="props" @refresh="reload" />
  </div>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessageBox } from 'element-plus'

const props = defineProps<{
  id: string,
  captureSetting: any
}>()
const outputOptioins = useOutputOptioins()
const { setDocumentTypeOpts } = outputOptioins
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'a-externalStorage-profile-output',
  virtualScroll: true,
  api: async (pageParams: any) => {
    return await clientApi.admin.getAdminext3rdstorageProfilesProfileidOutputrecordList(props.id, {
      ...extraParams
    }).then((res: any) => res.data)
  },
  columns: [
    { field: 'document_type', title: 'docType_documentType' },
    { field: 'output_format', title: 'externalStorage.outputFormat' },
    { field: 'destination', title: 'externalStorage.destination' },
    { field: 'path', title: 'externalStorage.path' },
    {
      field: 'status',
      title: 'common_status',
      slots: {
        default: 'status'
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: t('common_edit'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEdit(row)
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
        code: 'duplicate',
        name: t('actions.duplicate'),
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDuplicate(row)
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
    handleEdit(row)
  }
})

function handleEdit(row: any) {
  DialogRef.value.handleOpen(row, true)
}

async function handleActive(row: any, status: string) {
  try {
    const result = await clientApi.admin.patchAdminext3rdstorageProfilesProfileidOutputrecordOutputrecordidUpdateStatus(props.id, row.id, { status: status }).then((res) => res.data)
    if (!!result) {
      row.status = status
    }
  } catch (error) {
    console.log(error)
  }
}

const DialogRef = ref()

async function handleOpen() {
  DialogRef.value.handleOpen()
}

async function handleDuplicate(row: any) {
  const detail = await clientApi.admin.getAdminext3rdstorageProfilesProfileidOutputrecordOutputrecordid(props.id, row.id).then((res: any) => res.data)
  DialogRef.value.handleOpen(detail)
}

async function handleDelete(row: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`)
    if (action !== 'confirm') return
    await clientApi.admin.deleteAdminext3rdstorageProfilesProfileidOutputrecordOutputrecordid(props.id, row.id).then((res) => res.data)
    reload()
  } catch (error) {
    console.log(error)
  }
}

provide('outputOptioins', outputOptioins)
watch(() => props.captureSetting, (newVal) => {
  console.log(newVal, 'captureSetting')
  if (newVal && newVal.documentType?.length > 0) {
    const opts = newVal.documentType.map((item: any) => ({ label: item, value: item }))
    setDocumentTypeOpts(opts)
  }
})
</script>
<style lang="scss" scoped>
.outputTable-container {
  height: 100%;
}

.actions {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-xs);
  align-items: center;
  justify-content: flex-end;
  --icon-size: var(--app-font-size-m);
}

:deep(.el-input) {
  width: 200px;
}
</style>
