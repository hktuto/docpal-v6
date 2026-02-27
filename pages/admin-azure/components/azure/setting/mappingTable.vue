<template>
  <el-card>
    <div class="title">{{ $t('azure.mapping') }}</div>
    <div class="description">{{ $t('azure.mappingDescription') }}</div>
    <div style="overflow: hidden; margin-top: var(--app-space-xs);">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <slot name="toolbar_buttons" />
        </template>
        <template #status="{row}">
          <el-tag v-if="row.status === 'open'" type="success">{{ $t('actions.activated') }}</el-tag>

          <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
        </template>
      </VxeGrid>
    </div>
    <el-button class="p-btn" type="primary" :loading="tableConfig.loading" @click="handleAdd">
      {{ $t('azureSettingMapping.add') }}
    </el-button>
  </el-card>
  <AzureSettingMappingDialog ref="AzureSettingMappingDialogRef" :exitList="tableData" @refresh="emits('refresh')" />
</template>

<script lang="ts" setup>
const azureProvider = inject(AzureProviderKey)
const routerProvider = inject(MenuRouterKey)
const props = defineProps(['tableData'])
const emits = defineEmits(['refresh'])
const state = reactive<any>({})

const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload, query } = useVxeTable({
  id: 'azureSettingMappingTableSetting',
  columns: [
    { field: 'id', title: 'dpTable_id', fixed: 'left' },
    { field: 'ocrProfileName', title: 'azureSettingMapping.name' },
    {
      field: 'state', title: 'dpTable_status',
      slots: {
        default: 'status'
      }
    },
    { field: 'scanProfile', title: 'azureSettingMapping.scanProfile' },
    { field: 'normalizeSetting', title: 'azureSettingMapping.normalizeSetting' },
    { field: 'scanType', title: 'azureSettingMapping.scanType' },
    {
      field: 'createdDate', title: 'dpTable_createdDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    {
      field: 'modifiedDate', title: 'table_modifiedDate',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    },
    { field: 'createdBy', title: 'role.creator' }
    // {  title: 'dpTable_actions',
    //     slots:{
    //         default:'more',
    //     }
    // },
  ],
  bodyActions: [
    [
      {
        code: 'edit_mapping',
        name: 'dpTool_edit',
        action: ({ row }: any) => {
          AzureSettingMappingDialogRef.value.handleOpen(row)
        }
      },
      {
        code: 'inactive',
        name: 'actions.inactive',
        action: ({ row }: any) => {
          handleActive('close', row)
        }
      },
      {
        code: 'active',
        name: 'actions.active',
        action: ({ row }: any) => {
          handleActive('open', row)
        }
      }
    ]
  ],
  dblClickAction: ({ row, column, event }: any) => {
    AzureSettingMappingDialogRef.value.handleOpen(row)
  },
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }

    if (args.code === 'inactive') {
      return {
        visible: args.row.status === 'open',
        disabled: false
      }
    }
    if (args.code === 'active') {
      return {
        visible: args.row.status === 'close',
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  }
})

const AzureSettingMappingDialogRef = ref()

function handleAdd() {
  AzureSettingMappingDialogRef.value.handleOpen()
}

async function handleActive(status: 'close' | 'open', row: any) {
  tableConfig.loading = true
  try {
    await azureProvider?.UpdateAzureOcrMappingApi({
      ...row,
      name: row.ocrProfileName,
      status
    })
    emits('refresh')
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
  }
  tableConfig.loading = false
}

watch(() => props.tableData, (newVal) => {
  if (!newVal) return
  tableRef.value?.loadData(newVal)
})
</script>

<style lang="scss" scoped>
.el-card {
  position: relative;
  margin-top: var(--app-space-s);

  :deep(.el-card__body) {
    height: 70vh;
    overflow: hidden;
    display: grid;
    grid-template-rows: min-content min-content 1fr;
  }

  .p-btn {
    position: absolute;
    right: var(--app-space-xs);
    top: var(--app-space-xs);
  }
}

.title {
  font-weight: bold;
  font-size: var(--app-font-size-l);
}
</style>
