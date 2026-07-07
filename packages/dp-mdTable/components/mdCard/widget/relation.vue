<script setup lang="ts">
import { postDynamicActions } from 'api'
import { emitBus, EventType } from 'eventbus'
import { ElMessage } from 'element-plus'
import { MDCardContextKey } from '../../../composables/mdCard/useMDCard'
import MdFormPopover from '../../mdForm/popover.vue'
import { buildRelationArray } from '../../../utils/relationHelper'
import { resolveColumnDataField } from '../../../utils/fieldValueFormat'

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const viewTools = inject<any>('viewTools', null)
const cardContext = inject<any>(MDCardContextKey, null)
const tableDataContext = useTableDataInject({ required: false })
const systemFieldsTypes = cardContext?.systemFieldsTypes ?? []
const updateRow = cardContext?.updateRow ?? tableDataContext?.updateRow

const relationFormPopoverRef = ref<InstanceType<typeof MdFormPopover>>()
const loading = ref(false)

const relationOptions = computed(() => props.field?.display_structure || props.field?.properties || {})
const relationTableId = computed(() => relationOptions.value?.relation_table_id ?? '')
const modelField = computed(() => resolveColumnDataField(props.field, 'field_name'))
const displayField = computed(() => {
  const displayFieldId = relationOptions.value?.display_field_ids?.[0]
  if (!displayFieldId || !relationTableId.value) return null

  return viewTools?.getRelationFieldConfig?.(relationTableId.value, displayFieldId) || null
})

const relationItems = computed(() => {
  if (!modelField.value || !displayField.value?.field_name) return []
  return buildRelationArray(props.row, modelField.value, displayField.value.field_name)
})

async function getRelationRowData(recordId: string) {
  const { data } = await postDynamicActions({
    tableId: relationTableId.value,
    conditions: [{ column: 'id', type: 'EQ', value: recordId }],
    columns: [{ name: '*' }]
  })
  return data.data?.[0] || null
}

async function handleRelationClick(item: Record<string, any>, event: MouseEvent | KeyboardEvent) {
  event.stopPropagation()

  const displayFieldName = displayField.value?.field_name
  if (!relationTableId.value || !item?.id || !displayFieldName) return

  loading.value = true
  try {
    const rowData = await getRelationRowData(item.id)
    if (!rowData) {
      ElMessage.error('Record not found')
      return
    }
    relationFormPopoverRef.value?.open(rowData, 'edit', item[displayFieldName])
  } finally {
    loading.value = false
  }
}

async function handleSubmit(data: any, id: string) {
  if (!relationTableId.value || !updateRow || !modelField.value) return

  await updateRow(id, data, relationTableId.value)

  const relationItem = relationItems.value.find((item) => item.id === id)
  if (!relationItem) return

  const newFormData: Record<string, any> = {}
  Object.keys(relationItem).forEach((key) => {
    if (key !== 'id') {
      newFormData[`${modelField.value}.${key}`] = data[key]
    }
  })

  emitBus(EventType.MD_TABLE_RELATION_NEED_REFRESH, {
    data: newFormData,
    relationTableId: relationTableId.value,
    relationRowId: id,
    relationField: modelField.value
  })
}
</script>

<template>
  <span v-if="!relationItems.length" class="field-value" @click.stop>--</span>
  <span v-else v-loading="loading" class="relation-card-widget field-value" @click.stop>
    <ElTag
      v-for="(item, index) in relationItems"
      :key="item.id || index"
      class="relation-card-widget__tag relation-tag"
      size="small"
      type="info"
      tabindex="0"
      :aria-label="String(item[displayField?.field_name] || '--')"
      @click="handleRelationClick(item, $event)"
      @keydown.enter.prevent="handleRelationClick(item, $event)"
    >
      {{ item[displayField?.field_name] || '-' }}
    </ElTag>

    <MdFormPopover
      ref="relationFormPopoverRef"
      :table-id="relationTableId"
      :system-fields-types="systemFieldsTypes"
      show-source-button
      @submit="handleSubmit"
    />
  </span>
</template>

<style scoped lang="scss">
.relation-card-widget {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  min-width: 0;
}

.relation-card-widget__tag {
  max-width: 100%;
  cursor: pointer;
}
</style>
