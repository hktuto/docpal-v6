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
import { rendererManager } from '@packages/dp-mdTable/renderers/registry-manager'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

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

const displayTitle = computed(() => props.setting?.title || 'Table View')

// Full field metadata indexed by field_name (includes business_type, display_structure, etc.)
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

const isAggregationMode = computed(() => !!props.setting?.groupByField)

const gridOptions = computed<VxeGridProps>(() => {
  const meta = fieldMetaMap.value

  if (isAggregationMode.value) {
    const groupField = props.setting?.groupByField
    const aggregations = props.setting?.aggregations || []

    const columns: any[] = []

    // Group by column
    const groupMeta = meta[groupField]
    columns.push({
      field: groupField,
      title: groupMeta?.field_name_alias || groupField,
      minWidth: 150
    })

    // Aggregation columns
    for (const agg of aggregations) {
      if (!agg.field) continue
      const alias = `agg_${agg.field}`
      const aggMeta = meta[agg.field]
      const aggLabel = agg.aggFunc?.toUpperCase?.() || 'AGG'
      columns.push({
        field: alias,
        title: `${aggLabel} of ${aggMeta?.field_name_alias || agg.field}`,
        minWidth: 150,
        align: 'right'
      })
    }

    // Count column
    columns.push({
      field: '__count',
      title: 'Count',
      minWidth: 100,
      align: 'right'
    })

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
        pageSize: pageSize.value,
        total: total.value
      }
    }
  }

  // Normal mode: build columns from selected fields
  const selectedColumns = props.setting?.columns || []

  const buildColumn = (fieldName: string) => {
    const fieldMeta = meta[fieldName]
    const title = fieldMeta?.field_name_alias || fieldName
    let base: any
    if (!fieldMeta) {
      base = {
        field: fieldName,
        title,
        minWidth: 120
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
        ...rendererManager.getColumnConfig(type, displayStructure, displayStructure)
      }
    }
    return base
  }

  const columns = selectedColumns.length
    ? selectedColumns.map((field: string) => buildColumn(field))
    : []

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

  // Backward compatibility: old sortField/sortOrder
  if (!result.length && props.setting?.sortField) {
    result.push({
      column: props.setting.sortField,
      desc: props.setting.sortOrder !== 'asc'
    })
  }

  return result
}

function buildAggregationParams() {
  const groupField = props.setting?.groupByField
  const aggregations = (props.setting?.aggregations || []).filter((a: any) => a.field && a.aggFunc)

  const columns: any[] = [{ name: groupField }]

  for (const agg of aggregations) {
    const isCount = agg.aggFunc.toLowerCase() === 'count'
    columns.push({
      name: isCount ? '*' : agg.field,
      alias: `agg_${agg.field}`,
      aggFunc: agg.aggFunc.toUpperCase()
    })
  }

  // Always include count
  columns.push({
    name: '*',
    alias: '__count',
    aggFunc: 'COUNT'
  })

  const orderBy = buildOrderBy()
  const fallbackOrderBy = orderBy.length
    ? orderBy
    : [{ column: groupField, desc: false }]

  const params: any = {
    tableId: props.setting.tableId,
    columns,
    groupBy: { columns: [groupField] },
    orderBy: fallbackOrderBy,
    pagination: {
      pageSize: pageSize.value,
      pageNum: currentPage.value
    }
  }

  const conditions = buildFilterConditions()
  if (conditions.length) {
    params.conditions = conditions
  }

  return params
}

function buildNormalParams() {
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

  return params
}

async function fetchData() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const params = isAggregationMode.value
      ? buildAggregationParams()
      : buildNormalParams()

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
    props.setting?.groupByField,
    props.setting?.aggregations
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
}
</style>
