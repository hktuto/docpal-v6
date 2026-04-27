<script setup lang="ts">
import { useMDTableInject } from '../../../composables/useMDTable'
import { Plus } from '@element-plus/icons-vue'
import { ColumnFieldType } from '../../../types/column-types'
import { buildRelationArray } from '../../../utils/relationHelper'
const props = withDefaults(
  defineProps<{
    modelValue: string[] | string | null
    relation_table_id: string
    display_field_ids: string[]
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

const mdTableContext = useTableDataInject()
const viewTools: any = inject('viewTools')
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
const curFieldName = computed(() => {
  return props.column.field
})
const relationPickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()

/** 当前选中 ID 对应的关联展示字段值，用于批量显示 */
const fields = computed(() => {
  return props.display_field_ids.reduce((acc: FieldInfo[], id: string) => {
    const fieldConfig = viewTools?.getRelationFieldConfig(props.relation_table_id, id)
    if (fieldConfig) {
      acc.push(fieldConfig)
    }
    return acc
  }, [])
})
const displayValues = computed(() => {
  if (props.display_field_ids.length === 0) {
    return []
  }
  const fieldNames = fields.value.map((field) => field.field_name)

  const relationArray = buildRelationArray(props.row, curFieldName.value, fieldNames)
  return relationArray
})

function handleAdd() {
  console.log('handleAdd', props.row, props.column)
}

function handleUpdate(value: string[] | string | null, selectedRows: any[]) {
  const normalizedValue = Array.isArray(value) ? value : value ? [value] : []
  const joinedValue = normalizedValue.filter((item: any) => item !== '[]')
  const fieldName = props.column.field
  props.row[fieldName] = joinedValue
  const params = {
    [fieldName]: joinedValue
  }
  const basicFieldNames = ['id', 'created_at', 'updated_at', 'updated_by', 'status', 'master_table_id']
  const basicRow = selectedRows.length > 0 ? selectedRows[0] : props.row
  const allSelectedRows = normalizedValue.reduce((acc, rowId) => {
    let row = selectedRows.find((sItem) => sItem.id === rowId)
    if (!row) {
      row = displayValues.value.find((sItem) => sItem.id === rowId)
    }
    if (row) {
      acc.push(row)
    }
    return acc
  }, [])
  Object.keys(basicRow).forEach((key) => {
    if (!basicFieldNames.includes(key)) {
      const fullKey = fieldName + '.' + key
      const relatedValue = allSelectedRows.reduce((acc, sItem) => {
        if (sItem[key]) {
          acc.push(sItem[key])
        }
        return acc
      }, [])
      props.row[fullKey] = relatedValue
    }
  })
  if (mdTableContext.updateRow && props.row?.id) {
    mdTableContext.updateRow(props.row.id, params) // rowId, data
  }
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
      <el-tag v-for="(item, index) in displayValues" type="info" :key="index" size="small">{{ item[fields[0].field_name] }}</el-tag>
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
