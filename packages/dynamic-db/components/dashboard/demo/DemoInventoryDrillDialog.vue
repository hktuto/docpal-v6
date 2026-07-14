<template>
  <el-dialog
  class="big"
    :model-value="modelValue"
    :title="dialogTitle"
    width="90%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="drill-dialog-body">
      <DemoTreeMatrix :tree-data="treeData" :columns="columns" :loading="loading" />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from './DemoTreeMatrix.vue'
import { loadInventory, buildTree, formatNumber, type DemoTreeNode } from '../../../composables/demo/useDemoData'

const props = defineProps<{
  modelValue: boolean
  /** Warehouse drill mode: loads inventory and filters by warehouse. */
  warehouse?: string | null
  /** Rows drill mode: caller supplies the inventory rows directly (e.g. an age bucket). */
  rows?: any[] | null
  title?: string
}>()

const emit = defineEmits(['update:modelValue'])

const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const dialogTitle = computed(() => props.title || (props.warehouse ? `${props.warehouse} — 库存明细` : '库存明细'))

const columns: MatrixColumn[] = [
  { field: 'label', title: '品牌 / 物料 / 日期码', width: 320, fixed: 'left' },
  { field: 'onHand', title: '现有数量', formatter: (r) => formatNumber(r.onHand || 0) },
  { field: 'reserved', title: '预留数量', formatter: (r) => formatNumber(r.reserved || 0) },
  { field: 'available', title: '可用数量', formatter: (r) => formatNumber(r.available || 0) }
]

watch(
  () => [props.modelValue, props.warehouse, props.rows] as const,
  async ([visible, warehouse, rows]) => {
    if (!visible) return
    loading.value = true
    try {
      const source = rows ?? (warehouse ? (await loadInventory()).filter((r) => r.warehouse === warehouse) : null)
      if (!source) return
      treeData.value = buildTree(source, {
        levels: (r) => [r.brand, r.parts, r.dateCode || '未知'],
        merge: (node, r) => {
          node.onHand = (node.onHand || 0) + r.onHand
          node.reserved = (node.reserved || 0) + r.reserved
          node.available = (node.available || 0) + r.available
        }
      })
    } catch (error) {
      console.error('Failed to load demo data:', error)
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.drill-dialog-body {
  height: 80vh;
}
:deep(.el-dialog__title) {
  font-size: 1.125rem;
}
</style>
