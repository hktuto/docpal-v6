<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-table-widget">
      <VxeGrid
        ref="gridRef"
        v-bind="gridOptions"
        :data="tableData"
        :loading="loading"
        height="100%"
      />
    </div>
  </DashboardCard>
  <DbTableWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import type { VxeGridProps } from 'vxe-table'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const tableData = ref<any[]>([])
const loading = ref(false)
const gridRef = ref()
const settingRef = ref()
const cardRef = ref()

const displayTitle = computed(() => props.setting?.title || 'Table View')

const gridOptions = computed<VxeGridProps>(() => {
  const selectedColumns = props.setting?.columns || []
  const columns = selectedColumns.length
    ? selectedColumns.map((field: string) => ({ field, title: field, minWidth: 120 }))
    : [
        { field: 'name', title: 'Name', minWidth: 120 },
        { field: 'createdTime', title: 'Created', minWidth: 140 }
      ]

  return {
    border: true,
    stripe: true,
    resizable: true,
    showOverflow: true,
    size: 'small',
    columns,
    pagerConfig: { enabled: false }
  }
})

async function fetchData() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const orderBy: any[] = []
    if (props.setting?.sortField) {
      orderBy.push({
        field: props.setting.sortField,
        order: props.setting.sortOrder || 'desc'
      })
    }
    const { data }: any = await postDynamicActions({
      tableId: props.setting.tableId,
      columns: [{ name: '*' }],
      orderBy,
      pagination: {
        pageSize: props.setting?.rowLimit || 10,
        pageNum: 1
      }
    })
    tableData.value = data?.data || []
  } catch (error) {
    console.error('Failed to fetch table data:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => [props.setting?.tableId, props.setting?.rowLimit, props.setting?.sortField, props.setting?.sortOrder],
  () => {
    fetchData()
  },
  { immediate: true }
)

defineExpose({
  resize: () => {
    gridRef.value?.recalculate()
  }
})
</script>

<style scoped lang="scss">
.db-table-widget {
  height: 100%;
  overflow: hidden;
}
</style>
