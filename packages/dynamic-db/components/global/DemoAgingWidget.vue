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
          <div v-if="row['qty_' + column.field]" class="aging-cell">
            <span class="qty">{{ formatNumber(row['qty_' + column.field] || 0) }}</span>
            <span class="cost">{{ formatCompactCurrency(row['cost_' + column.field] || 0) }}</span>
          </div>
        </template>
      </DemoTreeMatrix>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import {
  loadInventory,
  loadPartCosts,
  buildTree,
  ageBucket,
  AGE_BUCKETS,
  formatNumber,
  formatCompactCurrency,
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

const title = computed(() => props.setting?.title || 'Aging Report')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Brand / Parts', width: 280, fixed: 'left' },
  ...AGE_BUCKETS.map((b) => ({ field: b.key, title: b.label, width: 110, rich: true })),
  { field: 'total', title: 'Total', width: 120, rich: true }
]

async function load() {
  loading.value = true
  try {
    const [rows, costs] = await Promise.all([loadInventory(), loadPartCosts()])
    treeData.value = buildTree(rows, {
      levels: (r) => [r.brand, r.parts],
      merge: (node, r) => {
        const bucket = ageBucket(r.ageDays)
        const cost = r.onHand * (costs[r.parts] || 0)
        node['qty_' + bucket] = (node['qty_' + bucket] || 0) + r.onHand
        node['cost_' + bucket] = (node['cost_' + bucket] || 0) + cost
        node.qty_total = (node.qty_total || 0) + r.onHand
        node.cost_total = (node.cost_total || 0) + cost
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
.aging-cell {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
  .cost {
    font-size: 0.6875rem;
    color: var(--el-text-color-secondary, #909399);
  }
}
</style>
