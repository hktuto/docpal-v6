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
      <DemoTreeMatrix :tree-data="treeData" :columns="salesOrderColumns" :loading="loading" />
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix from '../dashboard/demo/DemoTreeMatrix.vue'
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

const title = computed(() => props.setting?.title || 'Inactive Item Report')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const [rows, stockByParts] = await Promise.all([loadSalesOrders(), loadStockByParts()])
    treeData.value = buildSalesOrderTree(
      rows.filter((r) => r.status === 'Cancelled'),
      stockByParts
    )
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
</style>
