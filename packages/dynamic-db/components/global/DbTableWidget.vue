<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-table-widget">
      <!-- Bulk action toolbar -->
      <div v-if="selectedCount > 0" class="bulk-toolbar">
        <span class="bulk-count">{{ selectedCount }} selected</span>
        <el-button type="danger" size="small" @click="handleBulkDelete">
          <Icon name="lucide:trash-2" size="14" />
          Delete
        </el-button>
      </div>
      <VxeGrid
        ref="gridRef"
        v-bind="gridOptions"
        :data="tableData"
        :loading="loading"
        height="100%"
        @page-change="handlePageChange"
        @cell-click="handleCellClick"
      />
    </div>
  </DashboardCard>
  <DbTableWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions, newClientApi } from 'api'
import type { VxeGridProps } from 'vxe-table'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { rendererManager } from '@packages/dp-mdTable/renderers/registry-manager'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { SingleDatabaseContextKey } from '../../composables/useSignleDatabase'
import { ElMessage, ElMessageBox } from 'element-plus'

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
const pageSize = ref(props.setting?.rowLimit || 10)
const total = ref(0)
const gridRef = ref()
const settingRef = ref()
const cardRef = ref()
const selectedCount = ref(0)

const displayTitle = computed(() => props.setting?.title || 'Table View')

// Full field metadata indexed by field_name
const fieldMetaMap = ref<Record<string, any>>({})
const { getFields } = useTableFields()

async function loadFieldMeta(tableId: string) {
  if (!tableId) {
    fieldMetaMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, any> = {}
  for (const f of fields) {
    map[f.field_name] = f
  }
  fieldMetaMap.value = map
}

const hiddenColumns = computed(() => new Set(props.setting?.hiddenColumns || []))
const columnWidths = computed<Record<string, number>>(() => props.setting?.columnWidths || {})

const gridOptions = computed<VxeGridProps>(() => {
  const selectedColumns = props.setting?.columns || []
  const meta = fieldMetaMap.value

  const checkboxCol = {
    type: 'checkbox',
    width: 44,
    fixed: 'left',
    align: 'center'
  }

  const buildColumn = (fieldName: string) => {
    const fieldMeta = meta[fieldName]
    const title = fieldMeta?.field_name_alias || fieldName
    const storedWidth = columnWidths.value[fieldName]
    const isHidden = hiddenColumns.value.has(fieldName)

    let base: any
    if (!fieldMeta) {
      base = {
        field: fieldName,
        title,
        minWidth: 120,
        width: storedWidth || undefined,
        visible: !isHidden
      }
    } else {
      const type = (fieldMeta.business_type as ColumnFieldType) || ColumnFieldType.Text
      const displayStructure = fieldMeta.display_structure || {}
      base = {
        ...fieldMeta,
        field: fieldMeta.field_name,
        title: fieldMeta.field_name_alias,
        aggFunc: true,
        colId: fieldMeta.field_name,
        width: storedWidth || undefined,
        visible: !isHidden,
        ...rendererManager.getColumnConfig(type, displayStructure, displayStructure)
      }
    }
    return base
  }

  const cols = selectedColumns.length
    ? selectedColumns.map((field: string) => buildColumn(field))
    : []

  return {
    border: true,
    stripe: true,
    resizable: true,
    showOverflow: true,
    size: 'small',
    columns: [checkboxCol, ...cols],
    checkboxConfig: {
      highlight: true,
      trigger: 'cell'
    },
    pagerConfig: {
      enabled: true,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      total: total.value
    }
  }
})

function buildFilterConditions(): any[] {
  const filterRules = props.setting?.filterRules || []
  if (!filterRules.length) return []

  const value = filterRules
    .filter((rule: any) => rule.field && rule.operator)
    .map((rule: any) => {
      const params: any = {
        column: rule.field,
        type: rule.operator
      }
      if (!['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE'].includes(rule.operator)) {
        let val = rule.value
        if (rule.operator === 'LIKE' && val) {
          val = `%${val}%`
        }
        params.value = val
      }
      return params
    })

  if (!value.length) return []
  return [{ type: 'AND', value }]
}

function buildOrderBy(): any[] {
  const sortRules = props.setting?.sortRules || []
  const result: any[] = []

  for (const rule of sortRules) {
    if (rule.field) {
      result.push({ column: rule.field, desc: rule.order === 'desc' })
    }
  }

  if (!result.length && props.setting?.sortField) {
    result.push({
      column: props.setting.sortField,
      desc: props.setting.sortOrder !== 'asc'
    })
  }

  return result
}

async function fetchData() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const orderBy = buildOrderBy()
    const conditions = buildFilterConditions()

    const params: any = {
      tableId: props.setting.tableId,
      columns: [{ name: '*' }],
      orderBy,
      pagination: {
        pageSize: pageSize.value,
        pageNum: currentPage.value
      }
    }

    if (conditions.length) {
      params.conditions = conditions
    }

    const { data }: any = await postDynamicActions(params)
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

function handlePageChange({ currentPage: page, pageSize: size }: any) {
  currentPage.value = page
  if (size) {
    pageSize.value = size
  }
  fetchData()
}

const dbContext = inject(SingleDatabaseContextKey, null)

function handleCellClick({ row }: any) {
  // Update selection count on any cell click (checkbox click triggers this)
  nextTick(() => {
    selectedCount.value = gridRef.value?.getCheckboxRecords().length || 0
  })
}

async function handleBulkDelete() {
  const records = gridRef.value?.getCheckboxRecords() || []
  if (!records.length) return

  try {
    await ElMessageBox.confirm(
      `Delete ${records.length} selected row(s)? This action cannot be undone.`,
      'Confirm Delete',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    )

    const ids = records.map((r: any) => r.id).filter(Boolean)
    if (!ids.length) return

    await newClientApi.deleteDynamicDbTableTableidDataBatch(props.setting.tableId, { ids })
    ElMessage.success(`${ids.length} row(s) deleted`)
    gridRef.value?.clearCheckboxRow()
    selectedCount.value = 0
    await fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete rows:', error)
      ElMessage.error('Failed to delete rows')
    }
  }
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
    loadFieldMeta(tableId)
  },
  { immediate: true }
)

watch(
  () => [
    props.setting?.tableId,
    props.setting?.rowLimit,
    props.setting?.sortField,
    props.setting?.sortOrder,
    props.setting?.filterRules,
    props.setting?.sortRules,
    props.setting?.columns,
    props.setting?.hiddenColumns,
    props.setting?.columnWidths
  ],
  () => {
    currentPage.value = 1
    pageSize.value = props.setting?.rowLimit || 10
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

provide('viewTools', { getPageParams: null, columns: gridOptions.value, tableFields: null })

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
  display: flex;
  flex-direction: column;
}
.bulk-toolbar {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}
.bulk-count {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--el-color-primary);
}
</style>
