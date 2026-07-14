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
      <DemoTreeMatrix
        :tree-data="treeData"
        :columns="salesOrderColumns"
        :loading="loading"
        :row-class-name="rowClassName"
        @cell-click="onCellClick"
      />
    </div>
    <DemoPartInventoryDialog v-model="partDialogVisible" :parts="partDialogParts" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoPartInventoryDialog from '../dashboard/demo/DemoPartInventoryDialog.vue'
import { loadSalesOrders, loadStockByParts, type DemoTreeNode } from '../../composables/demo/useDemoData'
import { salesOrderColumns, buildSalesOrderTree } from '../../composables/demo/salesOrderReport'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Sales Order Report')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

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

async function load() {
  loading.value = true
  try {
    const [rows, stockByParts] = await Promise.all([loadSalesOrders(), loadStockByParts()])
    treeData.value = buildSalesOrderTree(rows, stockByParts)
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
.demo-widget :deep(.is-clickable) {
  cursor: pointer;
}
</style>
