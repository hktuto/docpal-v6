<template>
  <DashboardCard
    ref="cardRef"
    :title="displayLabel"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-stat-widget">
      <div class="stat-value" :style="{ color: countColor }">
        {{ formattedValue }}
      </div>
    </div>
  </DashboardCard>
  <DbStatWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
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

const value = ref(0)
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayLabel = computed(() => props.setting?.label || 'Records')

const countColor = computed(() => {
  const colorMap: Record<string, string> = {
    primary: 'var(--el-color-primary)',
    success: 'var(--el-color-success)',
    warning: 'var(--el-color-warning)',
    danger: 'var(--el-color-danger)'
  }
  return colorMap[props.setting?.color] || 'var(--el-color-primary)'
})

const formattedValue = computed(() => {
  const v = value.value
  if (Number.isInteger(v)) return v.toString()
  return v.toFixed(2)
})

async function fetchValue() {
  const { tableId, aggregation, field, filterField, filterValue } = props.setting || {}
  if (!tableId) return
  loading.value = true
  try {
    const conditions = filterField && filterValue
      ? [
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
        ]
      : undefined

    if (aggregation === 'count') {
      const { data }: any = await postDynamicActions({
        tableId,
        columns: [{ name: '*' }],
        conditions,
        pagination: { pageSize: 1, pageNum: 1 }
      })
      value.value = data?.meta?.total || 0
      return
    }

    // Server-side aggregation for sum/avg/min/max
    const aggFunc = aggregation.toUpperCase()
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [
        {
          name: field || '*',
          alias: 'agg_value',
          aggFunc
        }
      ],
      conditions
    })

    const row = data?.data?.[0]
    const rawValue = row?.agg_value
    if (rawValue === null || rawValue === undefined) {
      value.value = 0
      return
    }

    const num = Number(rawValue)
    value.value = isNaN(num) ? 0 : num
  } catch (error) {
    console.error('Failed to fetch stat:', error)
    value.value = 0
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
  () => [props.setting?.tableId, props.setting?.aggregation, props.setting?.field, props.setting?.filterField, props.setting?.filterValue],
  () => {
    fetchValue()
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchValue
)

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-stat-widget {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}
</style>
