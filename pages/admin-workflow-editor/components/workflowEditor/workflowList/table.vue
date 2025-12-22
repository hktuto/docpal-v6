<script lang="ts" setup>
import { WorkflowEditorListProviderKey } from '~/utils/workflowEditorProvider'
import dayjs from 'dayjs'

const listProvider = inject(WorkflowEditorListProviderKey)
if (!listProvider) {
  throw new Error('WorkflowEditorListProviderKey not found')
}
const { t } = useI18n()
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'workflowEditorListTableSetting',
  api: (pageParams: any) => {
    if (!pageParams.orderBy) {
      pageParams.orderBy = 'modifiedDate'
      pageParams.isDesc = true
    }
    return listProvider.getListApi(pageParams)
  },
  dblClickAction: ({ row, column, event }: any) => {
    listProvider.openLastestVersion(row)
  },
  remoteSort: true,
  defaultSort: [
    {
      field: 'modifiedDate',
      order: 'desc'
    }
  ],
  columns: [
    {
      field: 'name',
      title: 'workflowEditor.name',
      fixed: 'left'
    },
    {
      field: 'productionVersion',
      title: 'dpTable.productionVersion',
      minWidth: 120
    },
    {
      field: 'latestVersion',
      title: 'dpTable.latestVersion',
      minWidth: 120
    },
    {
      field: 'modifiedBy',
      title: 'workflow_editorLastModified',
      minWidth: 120
    },
    {
      field: 'createdDate',
      title: 'searchGroup.createdDate',
      minWidth: 120,
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('YYYY-MM-DD HH:mm')
      }
    },
    {
      field: 'modifiedDate',
      title: 'workflow_editorLastDate',
      minWidth: 120,
      formatter({ cellValue }: any) {
        return dayjs(cellValue).format('YYYY-MM-DD HH:mm')
      }
    },
    {
      field: 'status',
      title: 'workflow_editorStatus',
      width: 200,
      slots: { default: 'status' }
      // formatter({ cellValue }: any) {
      //   return cellValue === 'A' ? t('actions.activate') : t('actions.inactive')
      // }
    }
  ],
  bodyActions: [
    [
      {
        code: 'edit_latest_version',
        name: 'workflow_editorEditLatestVersion',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          listProvider.openLastestVersion(row)
        }
      },
      // {
      //     code: 'edit_latest_version_new_tab',
      //     name: 'Edit Latest Version in New Tab',
      //     visible: true,
      //     disabled: false,
      //     action: ({row}:any) => {
      //         listProvider.openLastestVersion(row, true)
      //     }
      // },
      {
        code: 'view_production',
        name: 'workflow_editorViewProductionVersion',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          listProvider.openProductionVersion(row)
        }
      },
      // {
      //     code : 'view_production_new_tab',
      //     name: 'View Production in New Tab',
      //     visible: true,
      //     disabled: false,
      //     action: ({row}:any) => {
      //         listProvider.openProductionVersion(row, true)
      //     }
      // },
      // {
      //   code: 'save_as_new_workflow',
      //   name: 'workflow_editorNewWorkflow',
      //   visible: true,
      //   disabled: false,
      //   action: ({ row }: any) => {
      //     listProvider.saveAsNewWorkflow(row)
      //   }
      // },
      {
        code: 'view_versions',
        name: 'workflow_editorViewVersionHistory',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          row.name = row.name + ' - ' + t('workflow_editorVersionHistory')
          listProvider.openVersions(row)
        }
      },
      {
        code: 'delete',
        name: 'workflow_editorInactive',
        visible: true,
        disabled: false,
        action: ({ row }) => {
          listProvider.deleteWorkflow(row)
        }
      }

    ]
  ],
  permissionMethod: (args: PermissionMethodParams) => {
    if (!args.row) {
      return { visible: false, disabled: false }
    }
    return listProvider.actionPermission(args)
  }
})

defineExpose({
  reload
})

</script>

<template>
  <vxe-grid
    ref="tableRef"
    v-bind="tableConfig"
    v-on="tableEvent"
  >
    <template #toolbar_buttons>
      <slot name="toolbar_buttons" />
    </template>
    <template #status="{ row }">
      <el-tag v-if="row.publishStatus=== 'A'" type="success">
        {{ $t('actions.activated') }}
      </el-tag>
      <el-tag v-else type="danger">{{ $t('actions.inactive') }}</el-tag>
    </template>
  </vxe-grid>
</template>
