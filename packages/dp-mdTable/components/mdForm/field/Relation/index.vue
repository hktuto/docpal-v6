<template>
  <MdFormItem v-if="formData && curFieldName" v-bind="props">
    <MdFormFieldRelationPicker
      v-if="relationTableId"
      ref="pickerRef"
      :model-value="currentValue"
      :relation-table-id="relationTableId"
      :display-field-ids="displayFieldIds"
      :table-label="tableLabel"
      :multiple="false"
      show-selected
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
const { columns} = inject('viewTools')
const relationTableId = computed(() => props.column?.display_structure?.relation_table_id ?? '')
const displayFieldIds = computed(() => props.column?.display_structure?.display_field_ids ?? [])
const curFieldName = computed(() => props.column?.[props.fieldName])
const { t } = useI18n()
const tableLabel = computed(() => props.column?.display_structure?.relationTableName ?? props.column?.title ?? t('mdTable.relationPicker.defaultTableLabel'))
const currentValue = computed(() => {
  const v = props.formData?.[curFieldName.value]
  return Array.isArray(v) ? v : v != null ? [v] : []
})

function handleOriginalClick(record: any) {
  emit('original-click', record)
}

function handleUpdate(value: string[] | string | null, selectedRows: any[]) {
  if (!props.formData || curFieldName.value == null) return
  const fieldName = curFieldName.value
  props.formData[fieldName] = value.join(',')
  // 如果props.row 存在属性 key_1680_411d7500，has
  const basicFieldNames = ['id', 'created_at', 'updated_at', 'updated_by', 'status', 'master_table_id']
  Object.keys(props.formData).forEach((key) => {
    if (!basicFieldNames.includes(key)) {
      if (key.startsWith(fieldName + '.')) {
        const pureKey = key.split('.')[1]
        const relatedValue = selectedRows.reduce((acc, sItem) => {
          if (sItem[pureKey]) {
            acc.push(sItem[pureKey])
          }
          return acc
        }, [])
        props.formData[key] = relatedValue.join(',')
      }
    }
  })
  console.log('props.formData', props.formData)
}
</script>

<style lang="scss" scoped>
.relation-no-config {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
:deep(.el-form-item__content) {
  line-height: unset;
  align-items: center;
}
</style>
