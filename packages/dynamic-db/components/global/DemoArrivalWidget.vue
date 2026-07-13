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
          <span v-if="column.field === 'status' && row.status" class="status-tag" :class="statusClass(row.status)">
            {{ row.status || '' }}
          </span>
        </template>
      </DemoTreeMatrix>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
import DemoTreeMatrix, { type MatrixColumn } from '../dashboard/demo/DemoTreeMatrix.vue'
import { loadArrivals, buildTree, formatNumber, type DemoTreeNode } from '../../composables/demo/useDemoData'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  { setting: () => ({}), hideSetting: false }
)

const emit = defineEmits(['delete'])

const title = computed(() => props.setting?.title || 'Upcoming Goods Arrival')
const treeData = ref<DemoTreeNode[]>([])
const loading = ref(false)

const columns: MatrixColumn[] = [
  { field: 'label', title: 'Warehouse / Brand / Delivery Date / PO / Parts', width: 300, fixed: 'left' },
  { field: 'qtyShipped', title: 'Qty Shipped', formatter: (r) => (r.qtyShipped != null ? formatNumber(r.qtyShipped) : '') },
  { field: 'carrier', title: 'Carrier', align: 'left', formatter: (r) => r.carrier || '' },
  { field: 'trackingNo', title: 'Tracking No', align: 'left', formatter: (r) => r.trackingNo || '' },
  { field: 'status', title: 'Status', align: 'center', rich: true }
]

function statusClass(status: string): string {
  if (status === 'In Transit') return 'in-transit'
  if (status === 'Delayed') return 'delayed'
  if (status === 'Delivered') return 'delivered'
  return ''
}

async function load() {
  loading.value = true
  try {
    const rows = await loadArrivals()
    treeData.value = buildTree(rows, {
      levels: (r) => [r.warehouse, r.brand, r.eta, r.poId, r.parts],
      init: (r) => ({ carrier: r.carrier, trackingNo: r.trackingNo, status: r.status }),
      merge: (node, r) => {
        node.qtyShipped = (node.qtyShipped || 0) + r.qtyShipped
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
.status-tag {
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 12px;
  &.in-transit {
    color: var(--el-color-primary, #409eff);
    background: rgba(64, 158, 255, 0.12);
  }
  &.delayed {
    color: var(--el-color-danger, #f56c6c);
    background: rgba(245, 108, 108, 0.12);
  }
  &.delivered {
    color: var(--el-color-success, #67c23a);
    background: rgba(103, 194, 58, 0.12);
  }
}
</style>
