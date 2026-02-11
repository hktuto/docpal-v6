<script setup lang="ts">
import { useMDTableInject } from '../../../composables/useMDTable'
import { Plus } from '@element-plus/icons-vue'
const props = withDefaults(
  defineProps<{
    modelValue: string[] | string | null
    relationTableId: string
    displayField: string
    multiple?: boolean
    placeholder?: string
    tableLabel?: string
    row: any
    column: any
  }>(),
  { tableLabel: '关联表' }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[] | string | null): void
}>()

const { updateRow } = useMDTableInject()

const currentValue = computed(() => {
  const v = props.modelValue
  return Array.isArray(v) ? v : v != null ? [v] : []
})

const relationPickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()

/** 当前选中 ID 对应的关联展示字段值，用于批量显示 */
const displayValues = computed(() => {
  const ids = currentValue.value
  if (!ids.length) return []
  const displayKey = props.column.field.includes('.') ? props.column.field : `${props.column.field}.${props.displayField}`
  const fromRow = props.row[displayKey]
  if (Array.isArray(fromRow) && fromRow.length === ids.length) return fromRow
  const map = relationPickerRef.value?.selectedRecordsMap
  if (map && props.displayField) return ids.map((id: string) => map[id]?.[props.displayField] ?? id)
  return ids
})

function handleAdd() {
  console.log('handleAdd', props.row, props.column)
}

function handleUpdate(value: string[] | string | null) {
  const ids = Array.isArray(value) ? value : value != null ? [value] : []
  const { row, column, displayField } = props

  row[column.field] = ids

  if (displayField) {
    const displayKey = column.field.includes('.') ? column.field : `${column.field}.${displayField}`
    const recordsMap = relationPickerRef.value?.selectedRecordsMap
    if (recordsMap) {
      const vals = ids.map((id: string) => recordsMap[id]?.[displayField] ?? id)
      row[displayKey] = vals
    } else {
      row[displayKey] = ids.length ? ids : undefined
    }
  }

  updateRow(row)
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="relation-edit">
    <MdFormFieldRelationPicker
      v-if="relationTableId"
      ref="relationPickerRef"
      mode=""
      :relation-table-id="relationTableId"
      :display-field="displayField"
      :multiple="multiple"
      :placeholder="placeholder"
      :table-label="tableLabel"
      :model-value="currentValue"
      @update:modelValue="handleUpdate"
    >
      <template #title>
        <el-icon @click="handleAdd"><Plus /></el-icon>
      </template>
    </MdFormFieldRelationPicker>
    <div v-if="displayValues && displayValues.length" class="relation-tags">
      <el-tag v-for="(label, index) in displayValues" :key="currentValue[index]" size="small">{{ label }}</el-tag>
    </div>
    <!-- {{ displayRecords }} -->
  </div>
</template>

<style scoped>
.relation-edit {
  display: flex;
  align-items: center;
  gap: 4px;
  
}
.relation-tags {
  display: flex;
  gap: 4px;
}
.relation-add-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
</style>
