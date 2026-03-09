<template>
  <MdFormItem v-if="formData && column?.[fieldName]" v-bind="props"
    >
    <MdFormFieldRelationPicker
      v-if="relationTableId"
      ref="pickerRef"
      :model-value="currentValue"
      :relation-table-id="relationTableId"
      :table-label="tableLabel"
      @update:model-value="handleUpdate"
      @original-click="handleOriginalClick"
    />
    <span v-else class="relation-no-config">{{ $t('mdTable.relationPicker.configRequired') }}</span>
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

const props = defineProps<{
  formData: any
  column: any
  fieldName: string
}>()

const emit = defineEmits<{
  (e: 'original-click', id: string): void
}>()
const pickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()
const availableRecords = ref<any[]>([])
const { queryRelatedTable, getFieldsForTable } = useColumnsInject()
const { columns } = useMDTableInject()
const relationTableId = computed(() => props.column?.display_structure?.relationTableId ?? '')
const { t } = useI18n()
const tableLabel = computed(() => props.column?.display_structure?.relationTableName ?? props.column?.title ?? t('mdTable.relationPicker.defaultTableLabel'))
const currentValue = computed(() => {
  const v = props.formData?.[props.column?.[props.fieldName]]
  return Array.isArray(v) ? v : v != null ? [v] : []
})

/**
 * 查找与当前 relation 共享同一关联表的 VirtualColumn 列
 */
function getVirtualColumnsForRelation(relationFieldName: string) {
  const cols = columns?.value ?? []
  return cols.filter((col: any) => {
    if (col.type !== ColumnFieldType.VirtualColumn) return false
    const sourceRelationField = col.display_structure?.sourceRelationField ?? col[props.fieldName]?.split('.')[0]
    return sourceRelationField === relationFieldName
  })
}
function handleOriginalClick(record: any) {
  emit('original-click', record)
}
function handleUpdate(value: string[]) {
  if (!props.formData || props.column?.[props.fieldName] == null) return

  const relationFieldName = props.column[props.fieldName].includes('.') ? props.column[props.fieldName].split('.')[0] : props.column[props.fieldName]
  props.formData[props.column[props.fieldName]] = value

  // 同步更新与当前 relation 共享同一关联表的 VirtualColumn 数据
  const virtualColumns = getVirtualColumnsForRelation(relationFieldName)
  if (virtualColumns.length > 0) {
    const recordsMap = pickerRef.value?.selectedRecordsMap?.value ?? pickerRef.value?.selectedRecordsMap ?? {}
    const ids = Array.isArray(value) ? value : value != null ? [value] : []
    virtualColumns.forEach((vc: any) => {
      const displayFieldName = vc.display_structure?.displayFieldName ?? vc[props.fieldName]?.split('.')[1]
      if (!displayFieldName) return
      const dataKey = `${relationFieldName}.${displayFieldName}`
      const vals = ids.map((id: string) => recordsMap[id]?.[displayFieldName] ?? id)
      props.formData[dataKey] = ids.length ? vals : undefined
    })
  }
}

</script>

<style lang="scss" scoped>
.relation-no-config {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
:deep(.el-form-item__content) {
  line-height: unset;
  display: flex;
  align-items: center;
}
</style>
