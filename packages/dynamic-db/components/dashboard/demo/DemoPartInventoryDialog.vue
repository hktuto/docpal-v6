<template>
  <el-dialog
  class="big"
    :model-value="modelValue"
    :title="`${parts || ''} — Inventory`"
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
  parts: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Warehouse / Sub Inventory / Date Code', width: 320, fixed: 'left' },
  { field: 'onHand', title: 'OnHand Qty', formatter: (r) => formatNumber(r.onHand || 0) },
  { field: 'reserved', title: 'Reserved Qty', formatter: (r) => formatNumber(r.reserved || 0) },
  { field: 'available', title: 'Available Qty', formatter: (r) => formatNumber(r.available || 0) }
]

watch(
  () => [props.modelValue, props.parts] as const,
  async ([visible, parts]) => {
    if (!visible || !parts) return
    loading.value = true
    try {
      const rows = await loadInventory()
      treeData.value = buildTree(
        rows.filter((r) => r.parts === parts),
        {
          levels: (r) => [r.warehouse, r.subInventory, r.dateCode || 'Unknown'],
          merge: (node, r) => {
            node.onHand = (node.onHand || 0) + r.onHand
            node.reserved = (node.reserved || 0) + r.reserved
            node.available = (node.available || 0) + r.available
          }
        }
      )
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
