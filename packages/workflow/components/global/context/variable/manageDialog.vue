<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { ElMessageBox } from 'element-plus'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const node = ref<Node>()
const { t } = useI18n()
const opened = ref(false)
const FormDialogRef = ref()
const { variables, deleteVariableItem } = useVariablesProvide()

function open() {
  node.value = graphProvider?.graph.value?.getNodes().find((node: any) => node.getData().type === 'process')
  if (!node.value) {
    routerProvider?.message.error('Process Node not found')
    return
  }

  opened.value = true
}

function openNewFieldDialog() {
  FormDialogRef.value?.handleOpen()
}

function handleDblclick(row: any) {
  FormDialogRef.value?.handleOpen(row)
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'WorkflowVariableManage',
  zoom: false,
  virtualScroll: true,
  api: () => {
    return variables.value
  },
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'tag' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    console.log('dblClickAction', row, column, event)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }) => {
          handleDblclick(row)
        }
      },
      {
        code: 'delete',
        name: 'common_delete',
        action: async ({ row }) => {
          const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete', { tip: t('bpmn.globalRuleTip') + ', ' })}`).catch((action) => action)
          if (action !== 'confirm') return
          deleteVariableItem(node.value, row.id)
          reload()
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }: { row: any; code?: string }) => {
    if (!row) {
      return { visible: false, disabled: false }
    }

    if (code === 'edit') {
      return {
        visible: !row.id.startsWith('__system__'),
        disabled: false
      }
    }

    if (code === 'delete') {
      return {
        visible: !row.id.startsWith('__system__'),
        disabled: false
      }
    }

    return {
      visible: false,
      disabled: true
    }
  },
  optionalConfig: {
    rowConfig: {
      keyField: 'id'
    }
  },
  saveColumnOrder: false
})

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="opened" title="Edit Variables" append-to-body class="big">
    <template #default>
      <div class="addFieldRow">
        <el-alert show-icon :title="$t('bpmn.globalRuleTip')" type="info" />
        <ElButton id="Workflow__EditField__AddField" type="primary" @click="openNewFieldDialog">Add Variable</ElButton>
      </div>
      <ElDivider />
      <div class="tableSection">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
          </template>
        </VxeGrid>
      </div>
    </template>
  </ElDialog>
  <LazyContextVariableEditVariableDialog :node="node" ref="FormDialogRef" @reload="reload" />
</template>

<style lang="scss" scoped>
.addFieldRow {
  display: flex;
  justify-content: flex-end;
}

.tableSection {
  height: 60vh;
}
</style>
