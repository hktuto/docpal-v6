<script setup lang="ts">
import { type VariableItem } from '@packages/workflow/composables/useWorkflowVariables'
import { MenuRouterKey } from '@packages/base/utils/menuType'

const form = defineModel<{}>('form')
const routerProvider = inject(MenuRouterKey)
const itemTypeOptions = [
  {
    label: 'Text',
    value: 'string'
  },
  {
    label: 'Number',
    value: 'number'
  },
  {
    label: 'Boolean',
    value: 'boolean'
  },
  {
    label: 'Date',
    value: 'date'
  },
  {
    label: 'Object',
    value: 'object'
  }
]
const properties = ref<VariableItem[]>([])
const newItemID = ref('')
const objectItemDialogRef = ref()

function handleItemTypeChange(value: string) {
  form.value.items.properties = {}
  if (value === 'object') {
    properties.value = []
  }
}

const { tableConfig, tableEvent, tableRef, query, reload, cleanSelectedRows } = useVxeTable({
  id: 'workflow_variable_item_table',
  api: async (pageParams: any) => {
    return properties.value
  },
  saveColumnOrder: false,
  refresh: false,
  zoom: false,
  columns: [
    { field: 'id', title: 'Id' },
    { field: 'name', title: 'Name' },
    { field: 'display_type', title: 'Type' },
    { field: 'required', title: 'Required' }
  ],
  dblClickAction: ({ row, column, event }: any) => {
    handleEdit(row)
  }
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
function handleDelete() {}

function handleAddItem(item: any) {

}
function handleUpdateItem(item: any) {}
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
          <el-button type="primary" @click="handleOpenAddItemDialog">Add Item</el-button>
        </template>
      </VxeGrid>
    </div>
  </template>

  <LazyContextVariableDataTypeObjectItemDialog ref="objectItemDialogRef" :properties="properties" @add="handleAddItem" @update="handleUpdateItem" />
</template>

<style scoped lang="scss"></style>
