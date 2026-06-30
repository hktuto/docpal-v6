<template>
  <MdFormItem v-if="formData && curFieldName" v-bind="props">
    <template v-if="relationTableId">
      <MdFormFieldRelationPicker
        class="relation-picker"
        ref="pickerRef"
        :model-value="currentValue"
        :relation-table-id="relationTableId"
        :display-field-ids="displayFieldIds"
        :table-label="tableLabel"
        :multiple="multiple"
        show-selected
        @update:model-value="handleUpdate"
      />
      <template v-for="id in formData[curFieldName]" :key="id">
        <MdFormFieldRelationCard
          v-loading="loading"
          :fields="fields"
          :data="selectedRecords[id]"
          :show-remove="true"
          @original-click="handleClick"
          @remove="handleRemove(id)"
        />
      </template>
    </template>
    <span v-else class="relation-no-config">{{ $t('mdTable.relationPicker.configRequired') }}</span>
    <MdFormPopover ref="MdFormPopoverRef" :tableId="relationTableId" :systemFieldsTypes="systemFieldsTypes" showSourceButton @submit="handleSubmit" />
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { postDynamicActions } from 'api'
import { emitBus, EventType } from 'eventbus'
import { ElMessage } from 'element-plus'
const props = defineProps<{
  formData: any
  column: any
  fieldName: string
}>()

const emit = defineEmits<{}>()
const systemFieldsTypes = [ColumnFieldType.CreatedTime, ColumnFieldType.LastModifiedTime, ColumnFieldType.CreatedBy, ColumnFieldType.LastModifiedBy]
const pickerRef = ref<InstanceType<typeof MdFormFieldRelationPicker>>()
const multiple = computed(() => props.column?.display_structure?.multiple ?? false)
const availableRecords = ref<any[]>([])
const { columns, getRelationFieldConfig } = inject('viewTools')
const relationTableId = computed(() => props.column?.display_structure?.relation_table_id ?? '')
const displayFieldIds = computed(() => props.column?.display_structure?.display_field_ids ?? [])
const curFieldName = computed(() => props.column?.[props.fieldName])
const { t } = useI18n()
const loading = ref(false)
const { updateRow } = useTableDataInject()
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
  }, [])
})
const selectedRecords = computed(() => {
  if (!currentValue.value) return []
  const displayFieldNames = fields.value.map((field) => field.field_name)
  const relationArray = buildRelationArray(props.formData, curFieldName.value, displayFieldNames)
  return relationArray.reduce((acc: any[], item: any) => {
    acc[item.id] = item
    return acc
  }, {})
})

function handleUpdate(value: string[] | string | null, selectedRows: any[]) {
  if (!props.formData || curFieldName.value == null) return
  const fieldName = curFieldName.value
  props.formData[fieldName] = value
  const allSelectedRows = value.reduce((acc, rowId) => {
    let row = selectedRows.find((sItem) => sItem.id === rowId)
    if (!row) {
      row = selectedRecords.value[rowId]
    }
    if (row) {
      acc.push(row)
    }
    return acc
  }, [])
  const basicFieldNames = ['id', 'created_at', 'updated_at', 'updated_by', 'status', 'master_table_id']
  const relationFieldNames = fields.value.map((field) => fieldName + '.' + field.field_name)
  const allFieldNames = [...Object.keys(props.formData), ...relationFieldNames]
  allFieldNames.forEach((key) => {
    if (!basicFieldNames.includes(key)) {
      if (key.startsWith(fieldName + '.')) {
        const pureKey = key.split('.')[1]
        const relatedValue = allSelectedRows.reduce((acc, sItem) => {
          if (sItem[pureKey]) {
            acc.push(sItem[pureKey])
          }
          return acc
        }, [])
        props.formData[key] = relatedValue
      }
    }
  })
}
const MdFormPopoverRef = ref()
const getRowData = async (id: string) => {
  const filters = [
    {
      column: 'id',
      type: 'EQ',
      value: id
    }
  ]
  const { data } = await postDynamicActions({
    tableId: relationTableId.value,
    conditions: filters,
    columns: [{ name: '*' }]
  })
  return data.data?.[0] || null
}
async function handleClick(data: any) {
  const fieldName = fields.value[0].field_name
  const title = data[fieldName]
  loading.value = true
  const rowData = await getRowData(data.id)
  if (!rowData) {
    ElMessage.error('Record not found')
    return
  }
  loading.value = false
  MdFormPopoverRef.value.open(rowData, 'edit', title)
}
async function handleSubmit(data: any, id: string) {
  await updateRow(id, data, relationTableId.value)
  const row = selectedRecords.value[id]
  if (!row) return
  const newFormData: any = {}
  Object.keys(row).forEach((key) => {
    const fullKey = curFieldName.value + '.' + key
    if (key !== 'id') {
      newFormData[fullKey] = data[key]
    }
  })
  emitBus(EventType.RELATION_NEED_REFRESH, {
    data: newFormData,
    relationTableId: relationTableId.value,
    relationRowId: id,
    relationField: curFieldName.value
  })
}
function handleRemove(id: string) {
  props.formData[curFieldName.value] = props.formData[curFieldName.value].filter((item: string) => item !== id)
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
.relation-picker {
  margin-bottom: var(--app-space-xs);
}
</style>
