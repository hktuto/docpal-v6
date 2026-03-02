<template>
  <div class="pageContainer--padding tableContainer">
    <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
      <template #toolbar_buttons>
        <div class="actionsButtonsContainer">
          <ResponsiveFilter ref="ResponsiveFilterRef" @form-change="handleFilterFormChange" inputKey="metadataName"
                            inputPlaceHolder="documentType_filter" />
          <div class="btns">
            <el-button id="DocumentType__CreateNewDocumentType__Create" type="primary" @click="handleCreate">
              {{ t('metadata.new') }}
            </el-button>
            <el-button id="DocumentType__CreateNewDocumentType__Export" type="primary" @click="handleExport">
              {{ t('metadata.export') }}
            </el-button>
          </div>
        </div>
      </template>
      <template #display="{ row }">
        <el-switch v-model="row.active" />
      </template>
    </VxeGrid>
    <MetadataDialogNew ref="metadataDialogNewRef" @reload="reload" />
    <MetadataDialogEdit ref="metadataDialogEditRef" @reload="reload" />
    <MetadataDialogDuplicate ref="metadataDialogDuplicateRef" @reload="reload" />
  </div>
</template>

<script lang="ts" setup>
import { newAdminApi } from 'api'
import { useDebounceFn } from '@vueuse/core'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'

const { t } = useI18n()
const ResponsiveFilterRef = ref()
const metadataDialogEditRef = ref()
const metadataDialogDuplicateRef = ref()
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
let extraParams: any = {}
const { tableConfig, tableEvent, tableRef, query, reload } = useVxeTable({
  id: 'metadataList',
  api: async (params: any) => {
    return await newAdminApi.postDmsMetadataPage({
      ...params,
      ...extraParams
    })
  },
  columns: [
    {
      field: 'name',
      title: 'table_name',
      fixed: 'left'
    },
    {
      field: 'dataType',
      title: 'meta.dataTypeText'
    },
    {
      field: 'lastModifiedDate',
      title: 'table_last_update',
      formatter({ cellValue }: any) {
        return formatDate(cellValue)
      }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleEdit(row)
        }
      },
      {
        code: 'duplicate',
        name: 'actions.duplicate',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDuplicate(row)
        }
      },
      {
        code: 'remove',
        name: 'common_remove',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleRemove(row)
        }
      }
    ]
  ],
  dblClickAction({ row, column, event }) {
    handleEdit(row)
  }
})

const metadataDialogNewRef = ref()

const handleFilterFormChange = useDebounceFn((formModel: any) => {
  extraParams = formModel
  reload()
}, 500)

const handleCreate = () => {
  metadataDialogNewRef.value.open()
}

async function handleExport() {
  const exportLoading = ElLoading.service({
    lock: true,
    text: t('metadata.export_loading'),
    background: 'rgba(0, 0, 0, 0.7)'
  })
  const result = await newAdminApi.postDmsMetadataExportMetadataCvs(
    { pageNum: 0, pageSize: 1000 },
    { format: 'blob', timeout: 0 }
  )
  downloadBlob(result, 'metadata.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  exportLoading.close()
}

const handleEdit = (row: any) => {
  // remove any additional field in row
  const editForm = {
    id: row.id,
    name: row.name,
    validationRule: row.validationRule || null,
    maskRule: row.maskRule || null,
    langs: row.langs || {}
  }
  console.log('Edit metadata:', editForm)
  metadataDialogEditRef.value.open(editForm)
  // TODO: Open edit dialog
}

const handleDuplicate = (row: any) => {
  // remove any additional field in row
  const duplicateForm = {
    id: row.id,
    name: row.name,
    validationRule: row.validationRule || null,
    maskRule: row.maskRule || null,
    langs: row.langs || {}
  }
  console.log('Duplicate metadata:', duplicateForm)
  metadataDialogDuplicateRef.value.open(duplicateForm)
}

const handleRemove = async (row: any) => {
  try {
    const action = await ElMessageBox.confirm(
      t('tip_deleteMsg', { modelName: 'MetaData', name: row.name }),
      {
        confirmButtonClass: 'el-button el-button--warning',
        confirmButtonText: t('common_confirmDelete')
      }
    )
    console.log('action', action)
    if (action !== 'confirm') return

    const result = await newAdminApi.deleteDmsMetadataMetadataid(row.id)
    if (result) {
      ElMessage.success(t('tip_deleteSuccessMessage'))
      reload()
    } else {
      ElMessage.error(t('metadata.remove_error'))
    }
    query()
  } catch (error) {
    console.log(error)
  }
}
</script>

<style lang="scss" scoped>
.pageContainer {
  :deep(.vxe-table--render-default .vxe-header-wrapper) {
    background-color: var(--app-color-bg-secondary);
  }
}

.actionsButtonsContainer {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr max-content;
  gap: var(--app-space-xs);
  @container (width < 600px) {
    grid-template-columns: 1fr;
  }
}
</style>
