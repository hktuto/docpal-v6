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
      <DemoFilterBar v-model="filterState" :filters="filters" />
      <div class="demo-grid">
      <DemoTreeMatrix
        :tree-data="treeData"
        :columns="salesOrderColumns"
        :loading="loading"
        :row-class-name="rowClassName"
        @cell-click="onCellClick"
      />
      </div>
    </div>
    <DemoPartInventoryDialog v-model="partDialogVisible" :parts="partDialogParts" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoFilterBar from '../dashboard/demo/DemoFilterBar.vue'
import DemoPartInventoryDialog from '../dashboard/demo/DemoPartInventoryDialog.vue'
import {
  loadSalesOrders,
  loadStockByParts,
  distinctValues,
  applyDemoFilters,
  type DemoFilterState,
  type DemoTreeNode
} from '../../composables/demo/useDemoData'
import { salesOrderColumns, salesOrderFilterDefs, buildSalesOrderTree } from '../../composables/demo/salesOrderReport'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || '銷售訂單報表')
const rawRows = ref<any[]>([])
const stockByParts = ref<Record<string, number>>({})
const loading = ref(false)
const filterState = ref<DemoFilterState>({})

const partDialogVisible = ref(false)
const partDialogParts = ref<string | null>(null)

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level === 3 ? 'is-clickable' : ''
}

function onCellClick({ row, triggerTreeNode }: any) {
  if (row.level !== 3 || triggerTreeNode) return
  partDialogParts.value = row.key
  partDialogVisible.value = true
}

const filters = computed(() =>
  salesOrderFilterDefs.map((def) =>
    def.type === 'select' ? { ...def, options: distinctValues(rawRows.value, def.field) } : def
  )
)

const treeData = computed(() =>
  buildSalesOrderTree(applyDemoFilters(rawRows.value, salesOrderFilterDefs, filterState.value), stockByParts.value)
)

async function load() {
  loading.value = true
  try {
    const [rows, stock] = await Promise.all([loadSalesOrders(), loadStockByParts()])
    rawRows.value = rows
    stockByParts.value = stock
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
  display: flex;
  flex-direction: column;
}
.demo-grid {
  flex: 1;
  min-height: 0;
}
.demo-widget :deep(.is-clickable) {
  cursor: pointer;
}
.demo-widget :deep(.is-clickable .vxe-cell--tree-node) {
  color: var(--el-color-primary, #409eff);
}
.demo-widget :deep(.is-clickable:hover .vxe-cell--tree-node) {
  text-decoration: underline;
}
</style>
