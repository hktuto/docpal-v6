<script setup lang="ts">
import { VariableTypeOptions } from '@packages/workflow/composables/useWorkflowVariables'

const { formField } = defineProps<{
  formField: any[]
}>()
const { getVariablesByDisplayTypes } = useVariablesProvide()
const emits = defineEmits(['update'])
const visible = ref(false)
const formFieldDetailDialog = ref()
const searchData = ref({
  id: '',
  name: '',
  type: ''
})

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'WorkflowUserFormVariableManage',
  zoom: false,
  virtualScroll: true,
  api: () => {
    return formField
  },
  columns: [
    { title: 'ID', field: 'id' },
    { title: 'Name', field: 'name' },
    { title: 'Type', field: 'display_type' }
  ],
  dblClickAction: ({ row, column, event }: any) => {},
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'common_edit',
        action: ({ row }) => {
          handleDblclick(row)
        }
      }
    ]
  ],
  permissionMethod: ({ row, code }: { row: any; code?: string }) => {
    if (!row) {
      return { visible: false, disabled: false }
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

function open() {
  visible.value = true
  getVariablesByDisplayTypes()
}

function handleDblclick(row: any) {
  formFieldDetailDialog.value.open(row)
}

function updateFormField(field: any) {
  emits('update', field)
  reload()
}

function filter() {
  const list = formField.filter((item: any) => {
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

watch(
  () => formField,
  () => {
    reload()
  },
  {
    immediate: true,
    deep: true
  }
)

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="Field Manage" append-to-body class="big">
    <div class="tableSection">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-form :inline="true" class="variable-filter-form">
            <el-form-item label="ID">
              <el-input v-model="searchData.id" @change="filter" clearable />
            </el-form-item>
            <el-form-item label="Name">
              <el-input v-model="searchData.name" @change="filter" clearable />
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
  </el-dialog>

  <LazyContextFormFieldDetailDialog ref="formFieldDetailDialog" @update="updateFormField" />
</template>

<style scoped lang="scss">
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
