<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { ElMessageBox } from 'element-plus'
import { VariableTypeOptions } from '#imports'

const routerProvider = inject(MenuRouterKey)
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const node = ref<Node>()
const { t } = useI18n()
const opened = ref(false)
const FormDialogRef = ref()
const { variables, deleteVariableItem, saveStartEventFormFields } = useVariablesProvide()

const searchData = ref({
  id: '',
  name: '',
  type: ''
})

function open() {
  const nodes: any[] = graphProvider?.graph?.value?.getNodes()
  node.value = nodes?.find((node: any) => node.getData().type === 'process')
  if (!node.value) {
    routerProvider?.message.error('Process Node not found')
    return
  }

  opened.value = true
}

function openNewFieldDialog() {
  FormDialogRef.value?.handleOpen()
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'WorkflowVariableManage',
  zoom: false,
  virtualScroll: true,
  api: () => {
    return variables.value
  },
  columns: [
    { title: 'ID', field: 'id' },
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'display_type' },
    { title: 'Required', field: 'required' }
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
          const startNode = graphProvider?.graph.value?.getCellById('system_start_event')
          saveStartEventFormFields(startNode)
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

function handleDblclick(row: any) {
  FormDialogRef.value?.handleOpen(row)
}

function filter() {
  const list = variables.value.filter((item: any) => {
    const s = searchData.value

    // 返回全部數據
    if (!s.id && !s.name && !s.type) return true

    // 判斷任一條件是否成立
    return (
      (s.id.toLowerCase() && item.id.toLowerCase().includes(s.id.toLowerCase())) ||
      (s.name.toLowerCase() && item.name.toLowerCase().includes(s.name.toLowerCase())) ||
      (s.type && item.display_type === s.type)
    )
  })
  tableRef.value?.loadData(list)
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog v-model="opened" title="Edit Variables" append-to-body class="big">
    <template #default>
      <div class="addFieldRow">
        <el-alert show-icon :title="$t('bpmn.globalRuleTip')" type="info" />
        <el-button id="Workflow__EditField__AddField" type="primary" @click="openNewFieldDialog">Add Variable</el-button>
      </div>
      <el-divider />
      <div class="tableSection">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #toolbar_buttons>
            <el-form :inline="true" class="variable-filter-form">
              <el-form-item label="ID">
                <el-input v-model="searchData.id" @blur="filter" clearable />
              </el-form-item>
              <el-form-item label="Name">
                <el-input v-model="searchData.name" @blur="filter" clearable />
              </el-form-item>
              <el-form-item label="Type">
                <el-select v-model="searchData.type" @change="filter" clearable>
                  <el-option-group v-for="group in VariableTypeOptions" :key="group.group" :label="$t(group.group)">
                    <el-option v-for="option in group.options" :key="option.display_type" :label="$t(option.label)" :value="option.display_type" />
                  </el-option-group>
                </el-select>
              </el-form-item>
            </el-form>
          </template>
        </VxeGrid>
      </div>
    </template>
  </el-dialog>

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

.variable-filter-form {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-end;
  gap: 16px;

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 180px;
  }
}
</style>
