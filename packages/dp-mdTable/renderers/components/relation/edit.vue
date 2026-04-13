<script setup lang="ts">
import { useMDTableInject } from '../../../composables/useMDTable'
import { Plus } from '@element-plus/icons-vue'
import { ColumnFieldType } from '../../../types/column-types'

const props = withDefaults(
  defineProps<{
    modelValue: string[] | string | null
    relation_table_id: string
    display_field_ids: string[]
    display_field_names: string[]
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

const { updateRow, columns } = useMDTableInject()
const currentValue = computed(() => {
  const v = props.modelValue
  if (typeof v === 'string') {
    return v.split(',')
  } else if (Array.isArray(v)) {
    return v
  } else {
    return []
  }
})

const relationPickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()

/** 当前选中 ID 对应的关联展示字段值，用于批量显示 */
const displayValues = computed(() => {
  if (props.display_field_names.length === 0) {
    return []
  }
  const fieldName = props.column.field
  const displayFieldNames = fieldName + '.' + props.display_field_names[0]
  const displayValue = props.row[displayFieldNames]
  return displayValue?.split(',').filter((val: any) => val !== '') || []
})

function handleAdd() {
  console.log('handleAdd', props.row, props.column)
}

function handleUpdate(value: string[] | string | null, selectedRows: any[]) {
  const fieldName = props.column.field
  props.row[fieldName] = value.join(',')
  const params = {
    [fieldName]: value.join(',')
  }
  // 如果props.row 存在属性 key_1680_411d7500，has
  const basicFieldNames = ['id', 'created_at', 'updated_at', 'updated_by', 'status', 'master_table_id']
  Object.keys(props.row).forEach((key) => {
    if (!basicFieldNames.includes(key)) {
      if (key.startsWith(fieldName + '.')) {
        const pureKey = key.split('.')[1]
        const relatedValue = selectedRows.reduce((acc, sItem) => {
          if (sItem[pureKey]) {
            acc.push(sItem[pureKey])
          }
          return acc
        }, [])
        props.row[key] = relatedValue.join(',')
      }
    }
  })
  updateRow(props.row.id, params) // rowId, data
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="relation-edit">
    <MdFormFieldRelationPicker
      v-if="relation_table_id"
      ref="relationPickerRef"
      mode=""
      :relationTableId="relation_table_id"
      :displayFieldIds="display_field_ids"
      :multiple="false"
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
      <el-tag v-for="(label, index) in displayValues" type="info" :key="currentValue[index]" size="small">{{ label }}</el-tag>
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
:deep(.relation-picker) {
  width: unset;
}
</style>
