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
        @page-change="handlePageChange"
      />
    </div>
  </DashboardCard>
  <DbTableWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import type { VxeGridProps } from 'vxe-table'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'

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
const currentPage = ref(1)
const total = ref(0)
const gridRef = ref()
const settingRef = ref()
const cardRef = ref()

const displayTitle = computed(() => props.setting?.title || 'Table View')

const fieldMap = ref<Record<string, string>>({})
const { getFields } = useTableFields()

async function loadFieldLabels(tableId: string) {
  if (!tableId) {
    fieldMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, string> = {}
  for (const f of fields) {
    map[f.field_name] = f.field_name_alias || f.field_name
  }
  fieldMap.value = map
}

const gridOptions = computed<VxeGridProps>(() => {
  const selectedColumns = props.setting?.columns || []
  const columns = selectedColumns.length
    ? selectedColumns.map((field: string) => ({
        field,
        title: fieldMap.value[field] || field,
        minWidth: 120
      }))
    : [
        { field: 'name', title: fieldMap.value['name'] || 'Name', minWidth: 120 },
        { field: 'createdTime', title: fieldMap.value['createdTime'] || 'Created', minWidth: 140 }
      ]

  return {
    border: true,
    stripe: true,
    resizable: true,
    showOverflow: true,
    size: 'small',
    columns,
    pagerConfig: {
      enabled: true,
      currentPage: currentPage.value,
      pageSize: props.setting?.rowLimit || 10,
      total: total.value
    }
  }
})

async function fetchData() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const orderBy: any[] = []
    if (props.setting?.sortField) {
      orderBy.push({
        column: props.setting.sortField,
        desc: props.setting.sortOrder !== 'asc'
      })
    }
    const { data }: any = await postDynamicActions({
      tableId: props.setting.tableId,
      columns: [{ name: '*' }],
      orderBy,
      pagination: {
        pageSize: props.setting?.rowLimit || 10,
        pageNum: currentPage.value
      }
    })
    tableData.value = data?.data || []
    total.value = data?.meta?.total || 0
  } catch (error) {
    console.error('Failed to fetch table data:', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange({ currentPage: page }: any) {
  currentPage.value = page
  fetchData()
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  currentPage.value = 1
  emit('refreshSetting', newSetting)
}

watch(
  () => props.setting?.tableId,
  (tableId) => {
    loadFieldLabels(tableId)
  },
  { immediate: true }
)

watch(
  () => [props.setting?.tableId, props.setting?.rowLimit, props.setting?.sortField, props.setting?.sortOrder],
  () => {
    currentPage.value = 1
    fetchData()
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  () => {
    currentPage.value = 1
    fetchData()
  }
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
