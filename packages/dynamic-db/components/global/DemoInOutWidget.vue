<template>
  <DashboardCard
    :title="title"
    :subtitle="setting.subtitle"
    :footer="setting.footer"
    :hide-setting="hideSetting"
    @delete="emit('delete')"
    @refresh="load"
  >
    <div class="demo-widget">
      <DemoTreeMatrix :tree-data="treeData" :columns="columns" :loading="loading">
        <template #cell="{ row, column }">
          <div v-if="row['in_' + column.field] || row['out_' + column.field]" class="inout-cell">
            <span class="in">↑ {{ formatNumber(row['in_' + column.field] || 0) }}</span>
            <span class="out">↓ {{ formatNumber(Math.abs(row['out_' + column.field] || 0)) }}</span>
          </div>
        </template>
      </DemoTreeMatrix>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import {
  loadTransactions,
  buildTree,
  monthKey,
  formatNumber,
  INBOUND_TYPES,
  OUTBOUND_TYPES,
  type DemoTreeNode
} from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Warehouse Inbound/Outbound')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)
const columns = ref<MatrixColumn[]>([
  { field: 'label', title: 'Warehouse / Brand / Parts', width: 260, fixed: 'left' }
])

async function load() {
  loading.value = true
  try {
    const rows = await loadTransactions()

    // Month columns derived from data
    const months = [...new Set(rows.map((r) => monthKey(r.date)))].sort()
    columns.value = [
      { field: 'label', title: 'Warehouse / Brand / Parts', width: 260, fixed: 'left' },
      ...months.map((m) => ({ field: m, title: m, width: 110, rich: true })),
      { field: 'total', title: 'Total', width: 120, rich: true }
    ]

    treeData.value = buildTree(rows, {
      levels: (r) => [r.warehouse, r.brand, r.parts],
      merge: (node, r) => {
        const m = monthKey(r.date)
        if (INBOUND_TYPES.includes(r.type)) {
          node['in_' + m] = (node['in_' + m] || 0) + r.qty
          node.in_total = (node.in_total || 0) + r.qty
        } else if (OUTBOUND_TYPES.includes(r.type)) {
          node['out_' + m] = (node['out_' + m] || 0) + r.qty
          node.out_total = (node.out_total || 0) + r.qty
        }
        // MOVE intentionally excluded (internal transfer)
      }
    })
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.demo-widget {
  height: 100%;
  width: 100%;
}
.inout-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  .in {
    color: var(--el-color-success, #67c23a);
  }
  .out {
    color: var(--el-color-danger, #f56c6c);
  }
}
</style>
