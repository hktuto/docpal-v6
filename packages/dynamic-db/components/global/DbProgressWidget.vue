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
    <div class="db-progress-widget">
      <div class="progress-info">
        <span class="progress-count">{{ matched }} / {{ total }}</span>
        <span class="progress-percent">{{ percentage }}%</span>
      </div>
      <el-progress :percentage="percentage" :color="progressColor" :stroke-width="16" />
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
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayLabel = computed(() => props.setting?.label || 'Progress')

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

async function fetchData() {
  const { tableId, filterField, filterValue } = props.setting || {}
  if (!tableId) return
  loading.value = true
  try {
    // Fetch total
    const totalRes: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      pagination: { pageSize: 1, pageNum: 1 }
    })
    total.value = totalRes.data?.meta?.total || 0

    // Fetch filtered count
    if (filterField && filterValue) {
      const filterRes: any = await postDynamicActions({
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
      matched.value = filterRes.data?.meta?.total || 0
    } else {
      matched.value = total.value
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
  () => [props.setting?.tableId, props.setting?.filterField, props.setting?.filterValue],
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
</style>
