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
        :columns="columns"
        :loading="loading"
        :row-class-name="rowClassName"
        @cell-click="onCellClick"
      />
    </div>
    <DemoSoTableDialog v-model="soDialogVisible" :title="soDialogTitle" :rows="soDialogRows" />
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import DemoSoTableDialog from '../dashboard/demo/DemoSoTableDialog.vue'
import { loadSalesOrders, buildTree, formatNumber, formatCurrency, type DemoTreeNode } from '../../composables/demo/useDemoData'
import { isActiveSO, outstandingValue } from '../../composables/demo/demoSales'
import { useDemoBrands, ALL_BRANDS } from '../../composables/demo/demoBrand'
import { useDemoYear, inDemoYear } from '../../composables/demo/demoYear'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || '客戶待出貨')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const brands = useDemoBrands()
const year = useDemoYear()

const filteredRows = ref<any[]>([])
const soDialogVisible = ref(false)
const soDialogTitle = ref('')
const soDialogRows = ref<any[]>([])

function rowClassName({ row }: { row: DemoTreeNode }): string {
  return row.level <= 1 ? 'is-clickable' : ''
}

function onCellClick({ row, triggerTreeNode }: any) {
  if (triggerTreeNode || (row.level !== 0 && row.level !== 1)) return
  const field = row.level === 0 ? 'customerGroup' : 'customer'
  soDialogRows.value = filteredRows.value.filter((r) => r[field] === row.key)
  soDialogTitle.value = `${row.key} — 銷售訂單`
  soDialogVisible.value = true
}

const columns: MatrixColumn[] = [
  { field: 'label', title: '客戶組 / 客戶', width: 280, fixed: 'left' },
  { field: 'outstandingQty', title: '待出貨數量', formatter: (r) => formatNumber(r.outstandingQty || 0) },
  { field: 'outstandingValue', title: '待出貨金額', formatter: (r) => formatCurrency(r.outstandingValue || 0) }
]

async function load() {
  loading.value = true
  try {
    const allRows = await loadSalesOrders()
    const rows = allRows
      .filter((r) => brands.value.includes(ALL_BRANDS) || brands.value.includes(r.brand))
      .filter((r) => inDemoYear(r.orderDate, year.value))
      .filter((r) => isActiveSO(r) && r.shippedQty < r.orderQty)
    rows.sort(
      (a, b) =>
        String(a.customerGroup).localeCompare(String(b.customerGroup)) ||
        String(a.customer).localeCompare(String(b.customer))
    )
    filteredRows.value = rows
    treeData.value = buildTree(rows, {
      levels: (r) => [r.customerGroup, r.customer],
      merge: (node, r) => {
        node.outstandingQty = (node.outstandingQty || 0) + (r.orderQty - r.shippedQty)
        node.outstandingValue = (node.outstandingValue || 0) + outstandingValue(r)
      }
    })
  } catch (error) {
    console.error('Failed to load demo data:', error)
  } finally {
    loading.value = false
  }
}

watch(brands, () => load())
watch(year, () => load())

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
.demo-widget :deep(.is-clickable .vxe-cell--tree-node) {
  color: var(--el-color-primary, #409eff);
}
.demo-widget :deep(.is-clickable:hover .vxe-cell--tree-node) {
  text-decoration: underline;
}
</style>
