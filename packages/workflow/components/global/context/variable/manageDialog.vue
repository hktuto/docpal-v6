<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { ElMessageBox } from 'element-plus'
import { WORKFLOW_PROVIDER } from '@packages/workflow/utils/workflowType'

const graphProvider = inject(WORKFLOW_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const props = defineProps<{ node: Node }>()
const { node } = toRefs(props)

const { t } = useI18n()
const opened = ref(false)
const FormDialogRef = ref()
const { getVariablesByType, deleteVariableItem } = useVariablesProvide()

function open() {
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
    return getVariablesByType()
  },
  columns: [
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'type' }
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
          deleteVariableItem(node, row.id)
          reload()
        }
      }
    ]
  ],
  optionalConfig: {
    rowConfig: {
      keyField: 'id'
    }
  },
  saveColumnOrder: false
})

watch(
  () => node,
  () => {
    if (!node) {
      node.value = graphProvider.graph.value?.getNodes().find((nodeItem: any) => nodeItem.type === 'process')
      if (!node.value) {
        throw new Error('find process node does not exist')
      }
    }
  }
)

defineExpose({
  open
})
</script>

<template>
  <ElDialog v-model="opened" width="80%" draggable append-to-body class="big">
    <template #header>
      <span style="font-size: var(--app-font-size-m); font-weight: bold">Edit Field</span>
    </template>
    <template #default>
      <div class="addFieldRow">
        <el-alert show-icon :title="$t('bpmn.globalRuleTip')" type="info" />
        <ElButton id="Workflow__EditField__AddField" type="primary" @click="openNewFieldDialog">Add Field</ElButton>
      </div>
      <ElDivider />
      <div class="tableSection">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <div>{{ $t('bpmn.globalRules') }}</div>
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
