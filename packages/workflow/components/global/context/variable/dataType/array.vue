<script setup lang="ts">
import { toWorkflowVariablesObj, type VariableItem } from '@packages/workflow/composables/useWorkflowVariables'

const form = defineModel<{}>('form')
const itemTypeOptions = [
  { label: 'Text', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Object', value: 'object' }
]
const properties = ref<VariableItem[]>([])
const objectItemDialogRef = ref()
const searchData = ref({
  id: '',
  name: '',
  type: ''
})
const subTypeOptions = ref([
  { label: 'Text', display_type: 'text' },
  { label: 'File', display_type: 'file' },
  { label: 'Number', display_type: 'number' },
  { label: 'Timestamp', display_type: 'timestamp' },
  { label: 'Boolean', display_type: 'boolean' },
  { label: 'Date', display_type: 'date' },
  { label: 'Json', display_type: 'json' },
  { label: 'Array', display_type: 'array' },
  { label: 'Object', display_type: 'object' }
])

function handleItemTypeChange(value: string) {
  form.value.items.properties = {}
  if (value === 'object') {
    properties.value = []
  }
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'workflow_variable_item_table',
  api: async (pageParams: any) => {
    return deepCopy(properties.value)
  },
  virtualScroll: true,
  saveColumnOrder: false,
  refresh: false,
  zoom: false,
  columns: [
    { field: 'id', title: 'Id' },
    { field: 'name', title: 'Name' },
    { field: 'display_type', title: 'Type' },
    { field: 'required', title: 'Required' }
  ],
  optionalConfig: {
    pagerConfig: {
      enabled: false
    }
  },
  dblClickAction: ({ row, column, event }: any) => {
    handleEdit(row)
  },
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
        code: 'remove',
        name: 'common_remove',
        visible: true,
        disabled: false,
        action: ({ row }: any) => {
          handleDelete(row.id)
        }
      }
    ]
  ]
})

function handleOpenAddItemDialog() {
  const row = {
    id: '',
    name: '',
    description: '',
    type: 'string',
    display_type: 'text',
    required: false,
    default_value: undefined
  }
  objectItemDialogRef.value.open(row)
}

function handleEdit(row: any) {
  objectItemDialogRef.value.open(row)
}

function handleDelete(id: string) {
  properties.value.splice(
    properties.value.findIndex((item: any) => item.id === id),
    1
  )
  updateProperties()
}

function handleAddItem(item: any) {
  properties.value.push(item)
  updateProperties()
}

function handleUpdateItem(item: any) {
  const index = properties.value.findIndex((prop: any) => prop.id === item.id)
  if (index !== -1) {
    properties.value[index] = item
  }
  updateProperties()
}

function updateProperties() {
  form.value.items.properties = toWorkflowVariablesObj(properties.value)
  reload()
}

function filter() {
  const list = properties.value.filter((item: any) => {
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

onMounted(() => {
  const pro: any = form.value.items.properties
  properties.value = Object.keys(pro).map((key) => ({
    id: key,
    ...pro[key]
  }))
})
</script>

<template>
  <el-form-item label="Item Type">
    <el-select v-model="form.items.type" @change="handleItemTypeChange">
      <el-option v-for="option in itemTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
    </el-select>
  </el-form-item>

  <template v-if="form.items.type === 'object'">
    <div style="height: 300px">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-form :inline="true" class="variable-filter-form">
            <el-button type="primary" @click="handleOpenAddItemDialog">Add Item</el-button>
            <el-form-item label="ID">
              <el-input v-model="searchData.id" @change="filter" clearable />
            </el-form-item>
            <el-form-item label="Name">
              <el-input v-model="searchData.name" @change="filter" clearable />
            </el-form-item>
            <el-form-item label="Type">
              <el-select v-model="searchData.type" @change="filter" clearable>
                <el-option v-for="option in subTypeOptions" :key="option.display_type" :label="$t(option.label)" :value="option.display_type" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>
      </VxeGrid>
    </div>
  </template>

  <LazyContextVariableDataTypeObjectItemDialog ref="objectItemDialogRef" :properties="properties" @add="handleAddItem" @update="handleUpdateItem" />
</template>

<style scoped lang="scss">
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
