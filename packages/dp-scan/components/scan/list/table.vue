<script lang="ts" setup>
import { useVxeTable } from '#imports'
import { clientApi } from 'api'
import { ScanTableColumns } from '#imports'
import { ElMessageBox } from 'element-plus'
const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}
const selectedRow = ref<any[]>([])
const { projects, isAdmin } = useScanClient()
const filter = useUserListFilter()

const pageParams = ref<any>({})
async function getListData(params:any) {
  pageParams.value = params
  if (filter.value.projectId.length === 0) return []
  cleanSelectedRows()
  const f = { ...filter.value }
  f.projectId = [filter.value.projectId]
  if(f.status && f.status.length) {
    // convert status to multiple stage
    const newStatusFilter:string[] = []
    f.status.forEach((status) => {
      const map = StatusMap[status]
      if(map) newStatusFilter.push(...map.status)
    })
    f.status = newStatusFilter
  }
  if (f.updatedAtEnd) {
    f.updatedAtEnd = f.updatedAtEnd.replace('00:00:00Z','23:59:59Z')
  }
  if(f.createdAtEnd) {
    f.createdAtEnd = f.createdAtEnd.replace('00:00:00Z','23:59:59Z')
  }
  const p = {
    ...params,
    ...f
  }
  const res = await clientApi.api.postCaptureBatchList(p)
  return res
}
const getListInterval = ref()
/**
 * Check if user can cancel batches based on project permissions
 * All selected batches must belong to projects where user is admin
 */
const canCancelBatches = (rows: any[]): boolean => {
  if (!rows || rows.length === 0) return false
  return rows.every((row) => {
    // Check status allows cancel
    const gorupStatus = statusToGroupStatus(row.status)
    const canCancelStatus = !gorupStatus || (gorupStatus.key !== 'cancelled')
    // Check user has admin permission for this batch's project
    const hasAdminPermission = isAdmin(row.projectId)
    return canCancelStatus && hasAdminPermission
  })
}
const emits = defineEmits(['updated'])
function cleanSelected() {
  cleanSelectedRows()
  // selectedRow.value = []
}
const exportLoading = ref(false)
async function batchExport(ids: string[]) {
  exportLoading.value = true;
  const batchIdList = ids ? ids : selectedRow.value.map((row) => row.id)
  if (!batchIdList || batchIdList.length === 0) return
  const token = localStorage.getItem('access_token')

  await fetch('/api/capture/export/zip',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ batchIdList }),
  }).then(async(res) => {
    const fileName = res.headers.get('content-disposition')?.split('filename=')[1]
    if (!fileName) return
    const b = await res.blob()
    const blob = new Blob([b], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName.replaceAll('"', '')
    a.click()
    URL.revokeObjectURL(url)
    a.remove()
  })
  emits('updated')
  exportLoading.value = false;
  // routerProvider?.message.info('Waiting Api to be ready')
}
async function cancelBatchs(ids: string[]) {
  const batchIds = ids ? ids : selectedRow.value.map((row) => row.id)
  if (!batchIds || batchIds.length === 0) return
  await clientApi.api.postCaptureBatchCancel({ batchIds })
  routerProvider?.message.success('Batch cancelled successfully')
  cleanSelectedRows()
    emits('updated')
}

async function handleCanelBatch(ids: string[]) {
  ElMessageBox.alert('Are you sure you want to cancel this batch?', '', {
    confirmButtonText: 'Yes',
    cancelButtonText: 'No',
    type: 'warning',
    callback: async (action: string) => {
      if (action === 'cancel') return
      try {
        await cancelBatchs(ids)
      } catch (error) {
        routerProvider.message.error('Failed to cancel batch')
      } finally {
        reload()
      }
    }
  })
}

const userId = useUserId()
function openDetail(row: any) {
  if(row.lockBy && row.lockBy !== userId.value) return
  const newTab = createBatchDetailPageTab(row.id)
  routerProvider?.navigateTo(newTab)
}
const { tableConfig, tableEvent, tableRef, reload, cleanSelectedRows } = useVxeTable({
  id: 'scan-table',
  api: async (params: any) => {
    return getListData(params)
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
    openDetail(row)
  },
  bodyActions: [
    [
      {
        code: 'view',
        name: 'Open',
        action: ({ row }) => {
          openDetail(row)
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
        }
      }
    ]
  ],
  permissionMethod: ({ code, row }) => {
    if (!row) {
      if (row.lockBy && row.lockBy !== userId.value) {
        return {
          visible: false,
          disabled: false
        }
      }
      if (code === 'cancel') {
        return {
          visible: canCancelBatches(row),
          disabled: false
        }
      }
      return {
        visible: false,
        disabled: false
      }
    }
    if (code === 'cancel') {
      const gorupStatus = statusToGroupStatus(row.status)
      const canCancelStatus = !gorupStatus || (gorupStatus.key !== 'cancelled' && gorupStatus.key !== 'completed')
      const hasAdminPermission = isAdmin(row.projectId)
      return {
        visible: canCancelStatus && hasAdminPermission,
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
const debounceReload = useDebounceFn(reload, 300)

watch(filter, debounceReload, {
  deep: true
})

onUnmounted(() => {
  if (getListInterval.value) {
    clearInterval(getListInterval.value)
  }
})


onMounted(() => {

  getListInterval.value = setInterval(async() => {

    // if pageParams is undefine that mean first run is not ready yet, ignore
    if (!pageParams.value) return
    try {

      const {data:{entryList}} = await getListData(pageParams.value)
      // get table data
        const { fullData } = tableRef.value?.getTableData()
        for(let i = 0; i < fullData.length; i++) {
          if (entryList[i].updatedAt !== fullData[i].updatedAt) {
            routerProvider?.reloadComponent()
            break
          }
        }

    } catch (err) {
      return
    }

  }, 30000)
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
          <ScanListMultipleSelect v-loading="exportLoading" :selectedRow="selectedRow" @cancel="cleanSelected" @batchCancel="handleCanelBatch" @batchExport="batchExport" />
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
  overflow: hidden;
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
