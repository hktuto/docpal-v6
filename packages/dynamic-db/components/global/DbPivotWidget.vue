<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-pivot-widget">
      <VxeGrid
        v-if="pivotColumns.length > 0"
        ref="gridRef"
        :data="pivotRows"
        :columns="pivotColumns"
        height="100%"
        size="small"
        border
        show-overflow
      />
      <div v-else class="empty-text">Configure row and column fields</div>
    </div>
  </DashboardCard>
  <DbPivotWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { resolveSelectLabel } from '@packages/dp-mdTable/utils/fieldValueFormat'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const rawData = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()
const gridRef = ref()

const displayTitle = computed(() => props.setting?.label || 'Pivot')

const rowField = computed(() => props.setting?.rowField || '')
const columnField = computed(() => props.setting?.columnField || '')
const valueField = computed(() => props.setting?.valueField || '')
const aggregation = computed(() => props.setting?.aggregation || 'sum')

// Field metadata for label resolution
const fieldMetaMap = ref<Record<string, any>>({})
const { getFields } = useTableFields()

async function loadFieldMeta(tableId: string) {
  if (!tableId) {
    fieldMetaMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, any> = {}
  for (const f of fields) {
    map[f.field_name] = f
  }
  fieldMetaMap.value = map
}

function getFieldLabel(fieldName: string): string {
  return fieldMetaMap.value[fieldName]?.field_name_alias || fieldName
}

function formatAxisValue(value: any, fieldName: string): string {
  const field = fieldMetaMap.value[fieldName]
  if (!field) return String(value ?? '(blank)')
  const bt = String(field.business_type || '')
  const isSelect = bt === ColumnFieldType.SingleSelect || bt === '3' ||
    bt === ColumnFieldType.MultiSelect || bt === '4'
  if (isSelect) {
    const options = field.display_structure?.options || field.properties?.options || []
    return resolveSelectLabel(value, options) || String(value ?? '(blank)')
  }
  return String(value ?? '(blank)')
}

const pivotRows = computed(() => {
  const rField = rowField.value
  const cField = columnField.value
  const vField = valueField.value
  if (!rField || !cField || !vField) return []

  // Collect all unique column values
  const colValues = new Set<string>()
  const rowMap = new Map<string, Map<string, number[]>>()

  for (const row of rawData.value) {
    const rVal = formatAxisValue(row[rField], rField)
    const cVal = formatAxisValue(row[cField], cField)
    const vRaw = row[vField]
    const vNum = vRaw === null || vRaw === undefined || vRaw === '' ? NaN : Number(vRaw)

    colValues.add(cVal)

    if (!rowMap.has(rVal)) {
      rowMap.set(rVal, new Map())
    }
    const colMap = rowMap.get(rVal)!
    if (!colMap.has(cVal)) {
      colMap.set(cVal, [])
    }
    if (!isNaN(vNum)) {
      colMap.get(cVal)!.push(vNum)
    }
  }

  const sortedColValues = Array.from(colValues).sort()

  // Build rows
  const result: any[] = []
  for (const [rVal, colMap] of rowMap) {
    const pivotRow: any = { [rField]: rVal }
    let rowTotal = 0
    let rowCount = 0

    for (const cVal of sortedColValues) {
      const values = colMap.get(cVal) || []
      let cellValue: number | string = '-'
      if (values.length > 0) {
        if (aggregation.value === 'count') {
          cellValue = values.length
        } else if (aggregation.value === 'sum') {
          cellValue = values.reduce((a, b) => a + b, 0)
        } else if (aggregation.value === 'avg') {
          cellValue = values.reduce((a, b) => a + b, 0) / values.length
        } else if (aggregation.value === 'min') {
          cellValue = Math.min(...values)
        } else if (aggregation.value === 'max') {
          cellValue = Math.max(...values)
        }
        if (typeof cellValue === 'number') {
          rowTotal += cellValue
          rowCount++
        }
      }
      pivotRow[cVal] = cellValue
    }

    // Add row total
    if (aggregation.value === 'avg' && rowCount > 0) {
      pivotRow['__total'] = rowTotal / rowCount
    } else {
      pivotRow['__total'] = rowTotal
    }
    result.push(pivotRow)
  }

  return result.sort((a, b) => String(a[rField]).localeCompare(String(b[rField])))
})

const pivotColumns = computed(() => {
  const rField = rowField.value
  const cField = columnField.value
  if (!rField || !cField) return []

  const colValues = new Set<string>()
  for (const row of rawData.value) {
    colValues.add(formatAxisValue(row[cField], cField))
  }
  const sortedColValues = Array.from(colValues).sort()

  const cols: any[] = [
    {
      field: rField,
      title: getFieldLabel(rField),
      width: 140,
      fixed: 'left'
    }
  ]

  for (const cVal of sortedColValues) {
    cols.push({
      field: cVal,
      title: cVal,
      width: 120,
      align: 'right'
    })
  }

  cols.push({
    field: '__total',
    title: 'Total',
    width: 120,
    align: 'right',
    fixed: 'right'
  })

  return cols
})

async function fetchData() {
  const { tableId, rowField, columnField, valueField } = props.setting || {}
  if (!tableId || !rowField || !columnField || !valueField) return
  loading.value = true
  try {
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: rowField }, { name: columnField }, { name: valueField }],
      pagination: {
        pageSize: 500,
        pageNum: 1
      }
    })
    rawData.value = data?.data || []
  } catch (error) {
    console.error('Failed to fetch pivot data:', error)
    rawData.value = []
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => props.setting?.tableId,
  (tableId) => {
    loadFieldMeta(tableId)
  },
  { immediate: true }
)

watch(
  () => [
    props.setting?.tableId,
    props.setting?.rowField,
    props.setting?.columnField,
    props.setting?.valueField,
    props.setting?.aggregation
  ],
  () => {
    fetchData()
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchData
)

defineExpose({
  resize: () => {
    gridRef.value?.recalculate()
  }
})
</script>

<style scoped lang="scss">
.db-pivot-widget {
  height: 100%;
  overflow: hidden;
}
.empty-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}
</style>
