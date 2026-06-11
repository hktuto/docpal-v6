<template>
  <DashboardCard
    ref="cardRef"
    :title="displayLabel"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-progress-widget">
      <!-- Legacy single-filter mode -->
      <template v-if="!isMultiSegment">
        <div class="progress-info">
          <span class="progress-count">{{ matched }} / {{ total }}</span>
          <span class="progress-percent">{{ percentage }}%</span>
        </div>
        <el-progress :percentage="percentage" :color="progressColor" :stroke-width="16" />
      </template>

      <!-- Multi-segment mode -->
      <template v-else>
        <div class="stacked-bar-wrap">
          <div class="stacked-bar">
            <div
              v-for="(seg, i) in segmentData"
              :key="i"
              class="stacked-segment"
              :style="{ width: seg.percent + '%', backgroundColor: seg.color }"
              :title="`${seg.label}: ${seg.value} (${seg.percent}%)`"
            />
          </div>
          <div class="stacked-total">
            Total: {{ total }}
          </div>
        </div>
        <div class="segment-legend">
          <div v-for="(seg, i) in segmentData" :key="i" class="legend-item">
            <span class="legend-dot" :style="{ backgroundColor: seg.color }" />
            <span class="legend-label">{{ seg.label }}</span>
            <span class="legend-value">{{ seg.value }} ({{ seg.percent }}%)</span>
          </div>
        </div>
      </template>
    </div>
  </DashboardCard>
  <DbProgressWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'

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

const matched = ref(0)
const total = ref(0)
const segmentValues = ref<Record<number, number>>({})
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayLabel = computed(() => props.setting?.label || 'Progress')

const isMultiSegment = computed(() => {
  const segs = props.setting?.segments
  return Array.isArray(segs) && segs.length > 0
})

const percentage = computed(() => {
  if (!total.value) return 0
  return Math.round((matched.value / total.value) * 100)
})

const progressColor = computed(() => {
  const colorMap: Record<string, string> = {
    primary: '#409eff',
    success: '#67c23a',
    warning: '#e6a23c',
    danger: '#f56c6c'
  }
  return colorMap[props.setting?.color] || '#409eff'
})

const segmentData = computed(() => {
  const segs = props.setting?.segments || []
  const t = total.value || 1
  return segs.map((seg: any, i: number) => {
    const val = segmentValues.value[i] || 0
    return {
      label: seg.label || `Segment ${i + 1}`,
      value: val,
      percent: Math.round((val / t) * 100),
      color: seg.color || '#409eff'
    }
  })
})

function buildConditions(filterRules: any[]): any[] {
  if (!filterRules?.length) return []

  const value = filterRules
    .filter((rule: any) => rule.field && rule.operator)
    .map((rule: any) => {
      const params: any = {
        column: rule.field,
        type: rule.operator
      }
      if (!['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE'].includes(rule.operator)) {
        let val = rule.value
        if (rule.operator === 'LIKE' && val) {
          val = `%${val}%`
        }
        params.value = val
      }
      return params
    })

  if (!value.length) return []
  return [{ type: 'AND', value }]
}

async function fetchTotal(): Promise<number> {
  const { tableId } = props.setting || {}
  const res: any = await postDynamicActions({
    tableId,
    columns: [{ name: '*' }],
    pagination: { pageSize: 1, pageNum: 1 }
  })
  return res.data?.meta?.total || 0
}

async function fetchSegmentCount(index: number): Promise<number> {
  const { tableId } = props.setting || {}
  const seg = props.setting?.segments?.[index]
  if (!seg) return 0
  const conditions = buildConditions(seg.filterRules || [])
  const res: any = await postDynamicActions({
    tableId,
    columns: [{ name: '*' }],
    conditions: conditions.length ? conditions : undefined,
    pagination: { pageSize: 1, pageNum: 1 }
  })
  return res.data?.meta?.total || 0
}

async function fetchData() {
  const { tableId } = props.setting || {}
  if (!tableId) return
  loading.value = true
  try {
    total.value = await fetchTotal()

    if (isMultiSegment.value) {
      const segs = props.setting?.segments || []
      const results = await Promise.all(segs.map((_: any, i: number) => fetchSegmentCount(i)))
      const vals: Record<number, number> = {}
      results.forEach((v, i) => { vals[i] = v })
      segmentValues.value = vals
      matched.value = results.reduce((sum, v) => sum + v, 0)
    } else {
      const { filterField, filterValue } = props.setting || {}
      if (filterField && filterValue) {
        const res: any = await postDynamicActions({
          tableId,
          columns: [{ name: '*' }],
          conditions: [
            {
              value: [
                {
                  column: filterField,
                  type: 'EQ',
                  value: filterValue
                }
              ],
              type: 'AND'
            }
          ],
          pagination: { pageSize: 1, pageNum: 1 }
        })
        matched.value = res.data?.meta?.total || 0
      } else {
        matched.value = total.value
      }
    }
  } catch (error) {
    console.error('Failed to fetch progress:', error)
    matched.value = 0
    total.value = 0
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
  () => [props.setting?.tableId, props.setting?.filterField, props.setting?.filterValue, props.setting?.segments],
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
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-progress-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--app-space-s);
  gap: var(--app-space-s);
}
.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--app-font-size-m);
}
.progress-count {
  color: var(--app-text-color-secondary);
}
.progress-percent {
  font-weight: 700;
  font-size: var(--app-font-size-xl);
  color: var(--app-text-color);
}
.stacked-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}
.stacked-bar {
  display: flex;
  height: 20px;
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
  background-color: var(--el-fill-color-light);
}
.stacked-segment {
  height: 100%;
  transition: width 0.3s ease;
  min-width: 2px;
}
.stacked-total {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  text-align: right;
}
.segment-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
  margin-top: var(--app-space-xs);
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--app-font-size-s);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.legend-label {
  color: var(--app-text-color);
}
.legend-value {
  color: var(--app-text-color-secondary);
}
</style>
