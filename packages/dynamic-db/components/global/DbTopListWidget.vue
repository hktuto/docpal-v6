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
    <div class="db-toplist-widget">
      <el-skeleton v-if="loading" :rows="5" animated />
      <template v-else-if="listData.length > 0">
        <div
          v-for="(item, index) in listData"
          :key="item.name"
          class="toplist-item"
        >
          <span class="toplist-rank">{{ index + 1 }}</span>
          <div class="toplist-bar-wrap">
            <div class="toplist-label-row">
              <span class="toplist-label" :title="item.name">{{ item.name }}</span>
              <span class="toplist-value">{{ formatNumber(item.value) }}</span>
            </div>
            <div class="toplist-bar-bg">
              <div
                class="toplist-bar-fill"
                :style="{ width: item.percent + '%' }"
              />
            </div>
          </div>
        </div>
      </template>
      <div v-else class="empty-text">No data</div>
    </div>
  </DashboardCard>
  <DbTopListWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
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

const rawData = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayTitle = computed(() => props.setting?.label || 'Top List')

const listData = computed(() => {
  const max = rawData.value.length ? Math.max(...rawData.value.map((d) => Number(d.value) || 0)) : 1
  return rawData.value.map((d) => ({
    name: d.name || '-',
    value: Number(d.value) || 0,
    percent: max > 0 ? Math.round(((Number(d.value) || 0) / max) * 100) : 0
  }))
})

function formatNumber(v: number): string {
  if (Number.isInteger(v)) return v.toString()
  return v.toFixed(2)
}

async function fetchData() {
  const { tableId, categoryField, valueField, aggregation, limit } = props.setting || {}
  if (!tableId || !categoryField) return
  loading.value = true
  try {
    const columns: any[] = [{ name: categoryField }]
    const metricAlias = aggregation === 'count' ? '__count' : '__agg'

    if (aggregation === 'count') {
      columns.push({ name: '*', alias: '__count', aggFunc: 'COUNT' })
    } else {
      const aggFunc = aggregation.toUpperCase()
      columns.push({
        name: valueField || '*',
        alias: '__agg',
        aggFunc
      })
    }

    // When groupBy is used, orderBy must reference the group column
    const orderBy = [{ column: categoryField, desc: true }]

    const { data }: any = await postDynamicActions({
      tableId,
      columns,
      orderBy,
      groupBy: { columns: [categoryField] },
      pagination: {
        pageSize: limit || 10,
        pageNum: 1
      }
    })

    const rows = data?.data || []
    // Sort client-side by metric descending to show true "top" order
    const sorted = rows
      .map((row: any) => ({
        name: row[categoryField],
        value: row[metricAlias]
      }))
      .sort((a: any, b: any) => (Number(b.value) || 0) - (Number(a.value) || 0))

    rawData.value = sorted
  } catch (error) {
    console.error('Failed to fetch top list:', error)
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
  () => [
    props.setting?.tableId,
    props.setting?.categoryField,
    props.setting?.valueField,
    props.setting?.aggregation,
    props.setting?.limit
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
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-toplist-widget {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-xs);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}
.toplist-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}
.toplist-rank {
  width: 24px;
  text-align: center;
  font-weight: 700;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
  flex-shrink: 0;
}
.toplist-bar-wrap {
  flex: 1;
  min-width: 0;
}
.toplist-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.toplist-label {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.toplist-value {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color);
  flex-shrink: 0;
  margin-left: var(--app-space-xs);
}
.toplist-bar-bg {
  height: 8px;
  background-color: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
}
.toplist-bar-fill {
  height: 100%;
  background-color: var(--el-color-primary);
  border-radius: var(--app-border-radius-s);
  transition: width 0.3s ease;
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
