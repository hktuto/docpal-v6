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
  const { tableId, aggregation, field } = props.setting || {}
  if (!tableId) return
  loading.value = true
  try {
    if (aggregation === 'count') {
      const { data }: any = await postDynamicActions({
        tableId,
        columns: [{ name: '*' }],
        pagination: { pageSize: 1, pageNum: 1 }
      })
      value.value = data?.meta?.total || 0
      return
    }

    // For sum/avg/min/max, fetch up to 500 records and compute client-side
    const { data }: any = await postDynamicActions({
      tableId,
      columns: field ? [{ name: field }] : [{ name: '*' }],
      pagination: { pageSize: 500, pageNum: 1 }
    })
    const rows = data?.data || []
    const numbers = rows
      .map((row: any) => Number(row[field]))
      .filter((n: number) => !isNaN(n))

    if (numbers.length === 0) {
      value.value = 0
      return
    }

    switch (aggregation) {
      case 'sum':
        value.value = numbers.reduce((a: number, b: number) => a + b, 0)
        break
      case 'avg':
        value.value = numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length
        break
      case 'min':
        value.value = Math.min(...numbers)
        break
      case 'max':
        value.value = Math.max(...numbers)
        break
      default:
        value.value = 0
    }
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
  () => [props.setting?.tableId, props.setting?.aggregation, props.setting?.field],
  () => {
    fetchValue()
  },
  { immediate: true }
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
