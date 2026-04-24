<template>
  <MdFormItem v-if="formData && curFieldName" v-bind="props">
    <template v-if="relationTableId">
      <MdFormFieldRelationPicker
        ref="pickerRef"
        :model-value="currentValue"
        :relation-table-id="relationTableId"
        :display-field-ids="displayFieldIds"
        :table-label="tableLabel"
        :multiple="multiple"
        show-selected
        @update:model-value="handleUpdate"
      />
      <template v-for="record in selectedRecords" :key="record.id">
        <MdFormFieldRelationCard
          :fields="fields"
          :data="record"
          :show-remove="true"
          @original-click="handleClick"
          @remove="handleRemove(record.id)"
        />
      </template>
    </template>
    <span v-else class="relation-no-config">{{ $t('mdTable.relationPicker.configRequired') }}</span>
    <MdFormPopover ref="MdFormPopoverRef" :tableId="relationTableId" :systemFieldsTypes="systemFieldsTypes" showSourceButton @submit="handleSubmit" />
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
}>()
const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
const pickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()
const multiple = computed(() => props.column?.display_structure?.multiple ?? false)
const availableRecords = ref<any[]>([])
const { columns, getRelationFieldConfig } = inject('viewTools')
const relationTableId = computed(() => props.column?.display_structure?.relation_table_id ?? '')
const displayFieldIds = computed(() => props.column?.display_structure?.display_field_ids ?? [])
const curFieldName = computed(() => props.column?.[props.fieldName])
const { t } = useI18n()
const tableLabel = computed(() => props.column?.display_structure?.relationTableName ?? props.column?.title ?? t('mdTable.relationPicker.defaultTableLabel'))
const currentValue = computed(() => {
  const v = props.formData?.[curFieldName.value]
  if (typeof v === 'string') {
    return v.split(',')
  } else if (Array.isArray(v)) {
    return v
  } else {
    return []
  }
})
const fields = computed(() => {
  return displayFieldIds.value.reduce((acc: FieldInfo[], id: string) => {
    const fieldConfig = getRelationFieldConfig(relationTableId.value, id)
    if (fieldConfig) {
      acc.push(fieldConfig)
    }
    return acc
  },[])
})
const selectedRecords = computed(() => {
  if (!currentValue.value) return []
  const displayFieldNames = fields.value.map((field) => field.field_name)
  const relationArray = buildRelationArray(props.formData, curFieldName.value, displayFieldNames)
  return relationArray
})

function handleUpdate(value: string[] | string | null, selectedRows: any[]) {
  if (!props.formData || curFieldName.value == null) return
  const fieldName = curFieldName.value
  props.formData[fieldName] = value
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
        console.log({ relatedValue }, key)
        props.formData[key] = relatedValue
      }
    }
  })
}
const MdFormPopoverRef = ref()
function handleClick(data: any) {
  const fieldName = fields.value[0].name
  const title = data[fieldName]
  MdFormPopoverRef.value.open(data, 'edit', title)
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
