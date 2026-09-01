<template>
  <div class="pageContainer--padding">
    <MdTable
      ref="tableRef"
      mode="page"
      :table-id="TABLE_NAME"
      :extra-column-config="config"
      @row-context-menu="handleRowContextMenu"
      @row-dblclick="({ row }) => dblclickHandler(row)"
    />
    <ToolsContextMenuPopover ref="contextMenuRef" />
    <AiUploadPreviewDialog ref="AiUploadPreviewDialogRef" />
  </div>
</template>

<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'
import { createAiUploadDetail } from '../../../utils/aiUpoloadHelper'
import { generateColumnConfig } from '@packages/dynamic-db/utils/tableViews/tablePageHelper'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const routerProvider = inject(MenuRouterKey)

const { t } = useI18n()
const userId = useUserId()
const TABLE_NAME = 'dms_upload_batch'
const columnSettings = [
  {
    id: 'nuxeo_path',
    field_name: 'nuxeo_path',
    field_name_alias: t('document_path'),
    business_type: ColumnFieldType.Text
  },
  {
    id: 'created_date',
    field_name: 'created_date',
    field_name_alias: t('document_uploadDate'),
    business_type: ColumnFieldType.DateTime
  },
  {
    id: 'files_count',
    field_name: 'files_count',
    field_name_alias: t('tableHeader_filesCount'),
    business_type: ColumnFieldType.Number
  },
  {
    id: 'upload_status',
    field_name: 'upload_status',
    field_name_alias: t('document_uploadStatus'),
    business_type: ColumnFieldType.SingleSelect,
    display_structure: {
      options: [
        {
          label: 'Ready',
          id: 'Ready',
          color: 'green'
        },
        {
          label: 'Canceled',
          id: 'Canceled',
          color: 'red'
        },
        {
          label: 'Prepare',
          id: 'Prepare',
          color: 'yellow'
        },
        {
          label: 'Confirmed',
          id: 'Confirmed',
          color: 'orange'
        }
      ]
    }
  },
  {
    id: 'modified_date',
    field_name: 'modified_date',
    field_name_alias: t('search.modifiedDate'),
    business_type: ColumnFieldType.DateTime,
    hidden: true
  }
]
const { config, tableRef, reload } = generateColumnConfig(TABLE_NAME, columnSettings, {
  defaultSortRules: [{ id: 'sort-modified_date', field: 'modified_date', order: 'desc' }]
})
provide('viewTools', config)

const eventList = [
  {
    label: 'Open',
    onClick: ({ row }: any) => {
      dblclickHandler(row)
    }
  },
  {
    label: 'Show Structure',
    onClick: ({ row }: any) => {
      showStructure(row)
    }
  },
  {
    label: 'Cancel',
    visible: ({ row }: any) => {
      return row.upload_status === 'Ready'
    },
    onClick: ({ row }: any) => {
      handleCancle(row.upload_id)
    }
  }
]
const { contextMenuRef, handleRowContextMenu } = useRowContextMenuActions({
  tableRef,
  eventList
})
function dblclickHandler(row: any) {
  if (row.upload_status === 'Ready') {
    const item = createAiUploadDetail({
      id: row.upload_id,
      status: row.upload_status
    })
    routerProvider?.navigateTo(item)
  } else {
    showStructure(row)
  }
}
async function handleCancle(id: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToCancel')}`, {
      confirmButtonText: t('dpButtom_confirm'),
      cancelButtonText: t('common_close')
    })
    if (action !== 'confirm') return
    await newClientApi.postDmsUploadCancel({ userId: userId.value, uploadId: id }).then((r) => r.data)
    reload()
  } catch (error) {
    console.log(error)
  }
}
const AiUploadPreviewDialogRef = ref()
function showStructure(row: any) {
  row.uploadId = row.upload_id
  row.uploadStatus = row.upload_status
  AiUploadPreviewDialogRef.value.handleOpen(row)
}
</script>

<style lang="scss" scoped>
:deep(.el-input) {
  width: 250px;
}
</style>
