<script setup lang="ts">
import { postDynamicActions } from 'api'
import { emitBus, EventType } from 'eventbus'
import { ElMessage } from 'element-plus'
import { ColumnFieldType } from '../../../types/column-types'
import { MDCardContextKey } from '../../../composables/mdCard/useMDCard'
import MdFormPopover from '../../mdForm/popover.vue'
import { buildRelationArray } from '../../../utils/relationHelper'
import { formatDateTime, formatNumber, resolveSelectLabel } from '../../../utils/fieldValueFormat'

interface DisplayItem {
  id: string
  relationItem: Record<string, any>
  label: string
  color?: string
  useTableTag?: boolean
}

const props = defineProps<{
  row: Record<string, any>
  field: Record<string, any>
}>()

const cardContext = inject<any>(MDCardContextKey, null)
const tableDataContext = useTableDataInject({ required: false })
const systemFieldsTypes = cardContext?.systemFieldsTypes ?? []
const updateRow = cardContext?.updateRow ?? tableDataContext?.updateRow

const relationFormPopoverRef = ref<InstanceType<typeof MdFormPopover>>()
const loading = ref(false)

const virtualOptions = computed(() => props.field?.display_structure || props.field?.properties || {})
const relationFieldName = computed(() => virtualOptions.value?.relation_field_name ?? '')
const displayFieldName = computed(() => virtualOptions.value?.display_field_name ?? '')
const relationTableId = computed(() => virtualOptions.value?.relation_table_id ?? '')
const displayFieldType = computed(() => virtualOptions.value?.display_field_type?.toString() ?? '')

const relationItems = computed(() => {
  if (!relationFieldName.value || !displayFieldName.value) return []
  return buildRelationArray(props.row, relationFieldName.value, displayFieldName.value)
})

function buildDisplayItem(item: Record<string, any>): DisplayItem {
  const fieldName = displayFieldName.value
  const config = virtualOptions.value
  const rawValue = item[fieldName]
  const selectOptions = config.properties?.options ?? config.options ?? []
  const fieldProps = config.properties ?? config

  switch (displayFieldType.value) {
    case ColumnFieldType.SingleSelect: {
      const option = selectOptions.find((o: any) => o.id === rawValue || o.value === rawValue || o.label === rawValue)
      return {
        id: item.id,
        relationItem: item,
        label: option?.label || resolveSelectLabel(rawValue, selectOptions) || '-',
        color: option?.color,
        useTableTag: true
      }
    }
    case ColumnFieldType.MultiSelect: {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue]
      const labels = values.map((value) => resolveSelectLabel(value, selectOptions)).filter(Boolean)
      return {
        id: item.id,
        relationItem: item,
        label: labels.join(', ') || '-',
        color: '#dddddd',
        useTableTag: true
      }
    }
    case ColumnFieldType.Number:
      return {
        id: item.id,
        relationItem: item,
        label: formatNumber(rawValue, fieldProps)
      }
    case ColumnFieldType.DateTime:
      return {
        id: item.id,
        relationItem: item,
        label: formatDateTime(rawValue, fieldProps)
      }
    default:
      return {
        id: item.id,
        relationItem: item,
        label: rawValue == null || rawValue === '' ? '-' : String(rawValue)
      }
  }
}

const displayItems = computed(() => relationItems.value.map(buildDisplayItem))

async function getRelationRowData(recordId: string) {
  const { data } = await postDynamicActions({
    tableId: relationTableId.value,
    conditions: [{ column: 'id', type: 'EQ', value: recordId }],
    columns: [{ name: '*' }]
  })
  return data.data?.[0] || null
}

async function handleRelationClick(item: Record<string, any>, title: string, event: MouseEvent | KeyboardEvent) {
  event.stopPropagation()

  if (!relationTableId.value || !item?.id) return

  loading.value = true
  try {
    const rowData = await getRelationRowData(item.id)
    if (!rowData) {
      ElMessage.error('Record not found')
      return
    }
    relationFormPopoverRef.value?.open(rowData, 'edit', title)
  } finally {
    loading.value = false
  }
}

async function handleSubmit(data: any, id: string) {
  if (!relationTableId.value || !updateRow || !relationFieldName.value) return

  await updateRow(id, data, relationTableId.value)

  const relationItem = relationItems.value.find((item) => item.id === id)
  if (!relationItem) return

  const newFormData: Record<string, any> = {}
  Object.keys(relationItem).forEach((key) => {
    if (key !== 'id') {
      newFormData[`${relationFieldName.value}.${key}`] = data[key]
    }
  })

  emitBus(EventType.MD_TABLE_RELATION_NEED_REFRESH, {
    data: newFormData,
    relationTableId: relationTableId.value,
    relationRowId: id,
    relationField: relationFieldName.value
  })
}
</script>

<template>
  <span v-if="!displayItems.length" class="field-value" @click.stop>--</span>
  <span v-else v-loading="loading" class="virtual-column-card-widget field-value" @click.stop>
    <template v-for="(item, index) in displayItems" :key="item.id || index">
      <div
        v-if="item.useTableTag"
        class="table-tag virtual-column-card-widget__tag relation-tag"
        :style="item.color ? { '--color': item.color } : undefined"
        tabindex="0"
        :aria-label="item.label"
        @click="handleRelationClick(item.relationItem, item.label, $event)"
        @keydown.enter.prevent="handleRelationClick(item.relationItem, item.label, $event)"
      >
        {{ item.label }}
      </div>
      <ElTag
        v-else
        class="virtual-column-card-widget__tag relation-tag"
        size="small"
        type="info"
        tabindex="0"
        :aria-label="item.label"
        @click="handleRelationClick(item.relationItem, item.label, $event)"
        @keydown.enter.prevent="handleRelationClick(item.relationItem, item.label, $event)"
      >
        {{ item.label }}
      </ElTag>
    </template>

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
.virtual-column-card-widget {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  min-width: 0;
}

.virtual-column-card-widget__tag {
  max-width: 100%;
  cursor: pointer;
}
</style>
