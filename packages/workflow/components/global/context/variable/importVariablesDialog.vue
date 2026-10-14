<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import {
  VariableTypeOptions,
  toWorkflowVariablesObj,
  type VariableItem
} from '@packages/workflow/composables/useWorkflowVariables'

export type ImportFieldSource = {
  id: string
  name: string
  field_type: string
  isRequired?: boolean
}

const props = withDefaults(
  defineProps<{
    fieldList?: ImportFieldSource[]
  }>(),
  {
    fieldList: () => []
  }
)

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { variables, addVariableItem, saveStartEventFormFields } = useVariablesProvide()
const emits = defineEmits(['reload'])

const opened = ref(false)
const idSource = ref<'id' | 'label'>('label')
const selectedRows = ref<ImportFieldItem[]>([])

type ImportFieldItem = {
  field_name: string
  field_name_alias: string
  id: string
  name: string
  field_type: string
  display_type: string
  type: VariableItem['type']
  isRequired: boolean
  exists: boolean
}

const rows = ref<ImportFieldItem[]>([])
const typeOptions = VariableTypeOptions.flatMap((group) => group.options)

const canConfirm = computed(() => selectedRows.value.length > 0)

const { tableConfig, tableEvent, tableRef } = useVxeTable({
  id: 'WorkflowImportVariables',
  zoom: false,
  refresh: false,
  saveColumnOrder: false,
  virtualScroll: true,
  height: '100%',
  api: () => rows.value,
  columns: [
    { type: 'checkbox', width: 50, align: 'center', fixed: 'left' },
    { field: 'id', title: 'ID', minWidth: 140, slots: { default: 'id' } },
    { field: 'name', title: 'Label', minWidth: 140, slots: { default: 'name' } },
    { field: 'display_type', title: 'Type', minWidth: 140, slots: { default: 'display_type' } },
    { field: 'exists', title: '', width: 90, slots: { default: 'exists' } }
  ],
  selectChangeHander: (selected: ImportFieldItem[]) => {
    selectedRows.value = selected.filter((row) => !row.exists)
  },
  optionalConfig: {
    pagerConfig: { enabled: false },
    toolbarConfig: { enabled: false },
    rowConfig: { keyField: 'field_name' },
    checkboxConfig: {
      checkMethod: ({ row }: { row: ImportFieldItem }) => !row.exists
    }
  }
})

async function refreshTable(selectImportable = false) {
  await nextTick()
  tableRef.value?.loadData(rows.value)
  selectedRows.value = []
  tableRef.value?.clearCheckboxRow()
  if (!selectImportable) return
  await nextTick()
  const importable = rows.value.filter((item) => !item.exists)
  if (importable.length) {
    tableRef.value?.setCheckboxRow(importable, true)
    selectedRows.value = importable
  }
}

function mapFieldType(fieldType: string): { display_type: string; type: VariableItem['type'] } {
  switch (fieldType) {
    case 'varchar':
      return { display_type: 'text', type: 'string' }
    case 'numeric':
      return { display_type: 'number', type: 'number' }
    case 'timestamp':
      return { display_type: 'timestamp', type: 'number' }
    case 'array':
      return { display_type: 'array', type: 'array' }
    default:
      return { display_type: 'text', type: 'string' }
  }
}

function isValidVariableId(id: string) {
  if (!id || id.startsWith('_') || id.startsWith('__system__')) return false
  return /^[a-zA-Z0-9_]+$/.test(id)
}

function toVariableId(raw: string) {
  if (!raw) return ''
  return raw
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function resolveVariableId(fieldName: string, alias: string) {
  if (idSource.value === 'label') {
    const fromLabel = toVariableId(alias)
    return fromLabel || fieldName
  }
  return fieldName
}

function refreshExists(row: ImportFieldItem) {
  const existingIds = new Set(variables.value.map((item) => item.id))
  row.exists = existingIds.has(row.id)
}

function handleIdChange(row: ImportFieldItem) {
  refreshExists(row)
  if (row.exists) {
    tableRef.value?.setCheckboxRow(row, false)
    selectedRows.value = selectedRows.value.filter((item) => item.field_name !== row.field_name)
  }
}

function handleTypeChange(row: ImportFieldItem) {
  const option = typeOptions.find((item) => item.display_type === row.display_type)
  if (option) {
    row.type = option.type as VariableItem['type']
  }
}

async function applyIdSource() {
  rows.value.forEach((row) => {
    row.id = resolveVariableId(row.field_name, row.field_name_alias)
    refreshExists(row)
  })
  await refreshTable(true)
}

function buildVariableItem(field: ImportFieldItem): VariableItem {
  const options = VariableTypeOptions.reduce((acc: any[], item: any) => {
    acc.push(...item.options)
    return acc
  }, [])
  const typeObject = deepCopy(options.find((item: any) => item.display_type === field.display_type))

  const variableItem: VariableItem = {
    id: field.id,
    name: field.name || field.id,
    description: '',
    type: typeObject?.type || field.type,
    display_type: field.display_type,
    required: field.isRequired,
    default_value: undefined,
    display_option: {}
  }

  if (field.display_type === 'array') {
    variableItem.minItems = 0
    variableItem.items = { type: 'string', properties: {} }
  } else if (typeObject?.validation) {
    variableItem.validation = typeObject.validation
  }

  return variableItem
}

function buildRowsFromProps() {
  const existingIds = new Set(variables.value.map((item) => item.id))

  rows.value = props.fieldList
    .filter((item) => isValidVariableId(item.id))
    .map((item) => {
      const mapped = mapFieldType(item.field_type)
      const id = resolveVariableId(item.id, item.name)
      return {
        field_name: item.id,
        field_name_alias: item.name,
        id,
        name: item.name || item.id,
        field_type: item.field_type,
        display_type: mapped.display_type,
        type: mapped.type,
        isRequired: !!item.isRequired,
        exists: existingIds.has(id)
      } as ImportFieldItem
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function handleOpen() {
  opened.value = true
  idSource.value = 'label'
  selectedRows.value = []
  buildRowsFromProps()
  await refreshTable(true)
}

function getSelectedFields() {
  const checkedRows = tableRef.value?.getCheckboxRecords?.() || selectedRows.value
  const selectedKeys = new Set(checkedRows.map((row: ImportFieldItem) => row.field_name))
  return rows.value.filter((item) => selectedKeys.has(item.field_name) && !item.exists)
}

function getProcessNode() {
  const byId = graphProvider?.graph.value?.getCellById(graphProvider?.workflowId.value)
  if (byId) return byId
  return graphProvider?.graph.value?.getNodes()?.find((node: any) => node.getData()?.type === 'process')
}

function getStartEventNode() {
  const byId = graphProvider?.graph.value?.getCellById('system_start_event')
  if (byId) return byId
  return graphProvider?.graph.value?.getNodes()?.find((node: any) => {
    const type = node.getData()?.type
    return type === 'startEvent' || type === 'StartEvent'
  })
}

async function confirmHandler() {
  const selected = getSelectedFields()
  if (!selected.length) {
    ElMessage.warning('Please select fields to import')
    return
  }

  const invalid = selected.find((item) => !isValidVariableId(item.id))
  if (invalid) {
    ElMessage.warning(`Invalid variable id: ${invalid.id || '(empty)'}`)
    return
  }

  const vNode = getProcessNode()
  if (!vNode) {
    ElMessage.error('Process Node not found')
    return
  }

  graphProvider?.graph.value?.startBatch('import-variables')
  try {
    selected.forEach((field) => {
      addVariableItem(vNode as any, buildVariableItem(field))
    })
    const startNode = getStartEventNode()
    if (startNode) {
      try {
        saveStartEventFormFields(startNode as any)
      } catch (e) {
        console.error('saveStartEventFormFields failed', e)
      }
    }

    // 同步到 workflowJson，并立即落库，避免刷新后丢失
    if (graphProvider.workflowJson?.value) {
      graphProvider.workflowJson.value.variables = toWorkflowVariablesObj(variables.value)
    }
    graphProvider.updateStatus()
    await graphProvider.saveWorkflowJSON()

    ElMessage.success(`Imported ${selected.length} variable(s)`)
    emits('reload')
    opened.value = false
  } catch (e) {
    console.error(e)
    ElMessage.error('Import variables failed')
  }
  graphProvider?.graph.value?.stopBatch('import-variables')
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog
    v-model="opened"
    class="big"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    title="Import Variables"
  >
    <el-form label-position="top">
      <el-form-item label="Use as ID">
        <el-select v-model="idSource" :disabled="!rows.length" @change="applyIdSource">
          <el-option label="ID (field name)" value="id" />
          <el-option label="Label (alias)" value="label" />
        </el-select>
      </el-form-item>
    </el-form>

    <template v-if="rows.length">
      <div class="field-toolbar">
        <span class="hint">{{ selectedRows.length }} selected</span>
      </div>
      <div class="table-section">
        <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
          <template #id="{ row }">
            <el-input v-model="row.id" size="small" @change="handleIdChange(row)" />
          </template>
          <template #name="{ row }">
            <el-input v-model="row.name" size="small" />
          </template>
          <template #display_type="{ row }">
            <el-select v-model="row.display_type" size="small" @change="handleTypeChange(row)">
              <el-option-group v-for="group in VariableTypeOptions" :key="group.group" :label="$t(group.group)">
                <el-option
                  v-for="option in group.options"
                  :key="option.display_type"
                  :label="$t(option.label)"
                  :value="option.display_type"
                />
              </el-option-group>
            </el-select>
          </template>
          <template #exists="{ row }">
            <el-tag v-if="row.exists" type="info" size="small">Exists</el-tag>
          </template>
        </VxeGrid>
      </div>
    </template>
    <el-empty v-else description="No fields found" />

    <template #footer>
      <el-button type="primary" :disabled="!canConfirm" @click="confirmHandler">导入变量</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.field-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: var(--app-space-s);
  margin-bottom: var(--app-space-s);
}

.hint {
  color: var(--el-text-color-secondary);
  font-size: var(--app-font-size-s);
}

.table-section {
  height: 40vh;
}
</style>
