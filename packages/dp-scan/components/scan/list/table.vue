<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { clientApi } from 'api'
import { ScanTableColumns } from '../../../utils/scanHelper'
import { ElMessageBox } from 'element-plus'
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const selectedRow = ref<any[]>([])
const { filter, projects } = useScanClient()

function cleanSelected() {
  cleanSelectedRows()
  // selectedRow.value = []
}
async function batchExport(ids: string[]) {
  const batchIds = ids ? ids : selectedRow.value.map((row) => row.id)
  if (!batchIds || batchIds.length === 0) return
  routerProvider?.message.info('Waiting Api to be ready')
}
async function cancelBatchs(ids: string[]) {
  const batchIds = ids ? ids : selectedRow.value.map((row) => row.id)
  if (!batchIds || batchIds.length === 0) return
  await clientApi.api.postCaptureBatchCancel({ batchIds })
  routerProvider?.message.success('Batch cancelled successfully')
}

const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'scan-table',
  api: async (params: any) => {
    cleanSelectedRows()
    const p = {
      ...params,
      ...filter.value
    }
    return clientApi.api.postCaptureBatchList(p)
  },
  customeToolBar: false,
  saveColumnOrder: false,
  zoom: false,
  refresh: false,
  columns: [
    {
      type: 'checkbox',
      width: 60,
      fixed: 'left'
    },
    ...ScanTableColumns
  ],
  dblClickAction: ({ row }) => {
    const newTab = createBatchDetailPageTab(row.batchNo)
    routerProvider?.navigateTo(newTab)
  },
  bodyActions: [
    [
      {
        code: 'view',
        name: 'Open',
        action: ({ row }) => {
          const newTab = createBatchDetailPageTab(row.batchNo)
          routerProvider?.navigateTo(newTab)
        }
      },
      {
        code: 'cancel',
        name: 'Cancel Batch',
        action: async ({ row }) => {
          ElMessageBox.alert('Are you sure you want to cancel this batch?', '', {
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            type: 'warning',
            callback: async (action: string) => {
              if (action === 'cancel') return
              try {
                await cancelBatchs([row.id])
              } catch (error) {
                routerProvider.message.error('Failed to cancel batch')
              } finally {
                reload()
              }
            }
          })
          // TODO : show confirm dialog and then call api to cancel batch
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }) => {
    if (!row) {
      return {
        visible: false,
        disabled: true
      }
    }
    if (code === 'cancel') {
      const gorupStatus = statusToGroupStatus(row.status)
      return {
        visible: !gorupStatus || (gorupStatus.key !== 'cancelled' && gorupStatus.key !== 'completed'),
        disabled: false
      }
    }
    return {
      visible: true,
      disabled: false
    }
  },
  selectChangeHander: (newSelectedRows) => {
    selectedRow.value = newSelectedRows
  }
})

watchThrottled(filter, reload, {
  throttle: 300,
  deep: true
})
</script>

<template>
  <div class="tableContainer">
    <vxe-grid ref="tableRef" v-bind="tableConfig" v-on="tableEvent" width="100%">
      <template #toolbar_buttons>
        <template v-if="!selectedRow.length">
          <ScanListFilter />
        </template>
        <template v-else>
          <ScanListMultipleSelect :selectedRow="selectedRow" @cancel="cleanSelected" @batchCancel="cancelBatchs" @batchExpor="batchExport" />
        </template>
      </template>
    </vxe-grid>
  </div>
</template>

<style lang="scss" scoped>
.tableContainer {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>

<style>
.table-status {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
}
.status-dot {
  width: var(--app-space-s);
  height: var(--app-space-s);
  border-radius: 50%;
  background-color: var(--status-color);
}
</style>
