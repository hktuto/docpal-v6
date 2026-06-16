<template>
  <DashboardCard
    ref="cardRef"
    :title="chartTitle"
    :subtitle="config.subtitle"
    :footer="config.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-pie-widget">
      <DbWidgetEmptyState v-if="!chartData.length" />
      <div v-else ref="chartContainer" class="chart-container" />
    </div>
  </DashboardCard>
  <DbPieWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import DbWidgetEmptyState from './DbWidgetEmptyState.vue'

// Register required modules
echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

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

const chartContainer = ref<HTMLDivElement>()
const chartInstance = ref<any>(null)
const chartData = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

// Full field metadata indexed by field_name (includes business_type, display_structure, etc.)
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

function fieldLabel(fieldName: string): string {
  return fieldMetaMap.value[fieldName]?.field_name_alias || fieldName
}

/**
 * Resolve a raw category value to a display label.
 * For SingleSelect/MultiSelect fields, maps option IDs to their labels.
 */
function resolveCategoryLabel(rawValue: any, fieldMeta: any): string {
  if (rawValue == null || rawValue === '') return 'Unknown'

  const type = fieldMeta?.business_type
  const options = fieldMeta?.display_structure?.options

  if (!Array.isArray(options)) return String(rawValue)

  if (type === '3' || type === 'SingleSelect') {
    const option = options.find((opt: any) => opt.id === rawValue)
    return option?.label || String(rawValue)
  }

  if (type === '4' || type === 'MultiSelect') {
    const ids = Array.isArray(rawValue) ? rawValue : [rawValue]
    const labels = ids
      .map((id: string) => {
        const option = options.find((opt: any) => opt.id === id)
        return option?.label || id
      })
      .filter(Boolean)
    return labels.length ? labels.join(', ') : String(rawValue)
  }

  return String(rawValue)
}

const config = computed(() => props.setting || {})

const chartTitle = computed(() => {
  const { label, categoryField } = config.value
  if (label) {
    return label
  }
  if (categoryField) {
    return fieldLabel(categoryField)
  }
  return 'Pie Chart'
})

function buildParams() {
  const { tableId, categoryField, valueField, aggregation, rowLimit } = config.value
  const limit = rowLimit || 20

  const columns: any[] = [{ name: categoryField }]
  const aggFunc = aggregation === 'count' ? 'COUNT' : (aggregation || 'sum').toUpperCase()

  columns.push({
    name: aggFunc === 'COUNT' ? '*' : valueField,
    alias: 'value',
    aggFunc
  })

  return {
    tableId,
    groupBy: { columns: [categoryField] },
    columns,
    orderBy: [{ column: categoryField, desc: false }],
    pagination: { pageSize: limit, pageNum: 1 }
  }
}

async function fetchData() {
  const { tableId, categoryField, aggregation, valueField } = config.value
  const hasValueField = aggregation === 'count' ? true : !!valueField

  if (!tableId || !categoryField || !hasValueField) {
    chartData.value = []
    return
  }

  loading.value = true
  try {
    const params = buildParams()
    const res: any = await postDynamicActions(params)
    const rows = res.data?.data || []

    const catMeta = fieldMetaMap.value[categoryField]

    chartData.value = rows.map((row: any) => ({
      name: resolveCategoryLabel(row[categoryField], catMeta),
      value: row.value ?? 0
    }))

    await nextTick()
    initChart()
  } catch (error) {
    console.error('Failed to fetch pie data:', error)
    chartData.value = []
  } finally {
    loading.value = false
  }
}

function initChart() {
  if (!chartContainer.value) return
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }

  const instance = echarts.init(chartContainer.value)
  chartInstance.value = instance

  const { chartType, appearance } = config.value
  let pieData = chartData.value.map((d) => ({ name: d.name, value: d.value }))

  // Auto-bucket small slices into "Other"
  const bucketThreshold = appearance?.bucketThreshold ?? 0
  if (bucketThreshold > 0 && pieData.length > 1) {
    const total = pieData.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
    const thresholdValue = total * (bucketThreshold / 100)
    const mainSlices = pieData.filter((d) => (Number(d.value) || 0) >= thresholdValue)
    const otherSlices = pieData.filter((d) => (Number(d.value) || 0) < thresholdValue)
    if (otherSlices.length > 1) {
      const otherValue = otherSlices.reduce((sum, d) => sum + (Number(d.value) || 0), 0)
      pieData = [...mainSlices, { name: 'Other', value: otherValue }]
    }
  }

  const showPercentage = appearance?.showPercentage ?? true
  const showAbsolute = appearance?.showAbsolute ?? true
  const innerRadius = appearance?.innerRadius ?? (chartType === 'donut' ? 40 : 0)
  const outerRadius = appearance?.outerRadius ?? 70

  const labelFormatter = (params: any) => {
    const parts: string[] = []
    if (showAbsolute) parts.push(params.name)
    if (showPercentage) parts.push(`${params.percent}%`)
    return parts.join('\n')
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const parts = [`${params.name}: ${params.value}`]
        if (showPercentage) parts.push(`(${params.percent}%)`)
        return parts.join(' ')
      }
    },
    legend: {
      show: true,
      orient: 'horizontal',
      bottom: '0%'
    },
    series: [
      {
        type: 'pie',
        radius: innerRadius > 0 ? [`${innerRadius}%`, `${outerRadius}%`] : [`0%`, `${outerRadius}%`],
        data: pieData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          show: pieData.length <= 20 || appearance?.forceLabels,
          formatter: labelFormatter
        }
      }
    ]
  }

  instance.setOption(option)

  // Drill-down click handler hidden per request
}

function handleResize() {
  if (chartInstance.value) {
    chartInstance.value.resize()
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
    props.setting?.categoryField,
    props.setting?.valueField,
    props.setting?.aggregation,
    props.setting?.chartType,
    props.setting?.rowLimit,
    props.setting?.label,
    props.setting?.appearance
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

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
})

// Expose resize for grid layout
defineExpose({
  resize: handleResize
})
</script>

<style scoped lang="scss">
.db-pie-widget {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}
/* removed empty-state style; replaced by DbWidgetEmptyState */
.chart-container {
  flex: 1;
  min-height: 0;
}
</style>
