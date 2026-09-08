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
import { convertFilterRuleToCondition } from '../../utils/PostgreSQLHelper'
import { formatDateTime } from '@packages/dp-mdTable/utils/fieldValueFormat'
import {
  isDateBusinessType,
  resolveWidgetColumnConfig,
  type ResolvedColumnConfigItem
} from '../../utils/dashboardFieldMeta'

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

const fieldMetaMap = ref<Record<string, any>>({})
const { getFields } = useTableFields()

async function loadFieldMeta(tableId: string) {
  if (!tableId) {
    fieldMetaMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  fieldMetaMap.value = Object.fromEntries(fields.map((f: any) => [f.field_name, f]))
}

const resolvedColumnConfig = computed(() =>
  resolveWidgetColumnConfig(props.setting, fieldMetaMap.value)
)

function isDateField(fieldName: string): boolean {
  const fromConfig = resolvedColumnConfig.value.find((c) => c.field === fieldName)?.businessType
  return isDateBusinessType(fromConfig || fieldMetaMap.value[fieldName]?.business_type)
}

function buildDateColumn(col: ResolvedColumnConfigItem, title: string, displayStructure: Record<string, any>) {
  const dateFormat = col.dateFormat || displayStructure.dateFormat || 'YYYY-MM-DD'
  return {
    field: col.field,
    title,
    width: col.width || undefined,
    visible: col.visible,
    business_type: col.businessType,
    formatter: ({ cellValue }: any) => {
      if (cellValue === null || cellValue === undefined || cellValue === '') return ''
      return formatDateTime(cellValue, { ...displayStructure, dateFormat })
    }
  }
}

function buildTypedColumn(col: ResolvedColumnConfigItem, fieldMeta: any, title: string, displayStructure: Record<string, any>) {
  const type = (col.businessType || fieldMeta?.business_type || ColumnFieldType.Text) as ColumnFieldType
  return {
    ...(fieldMeta || {}),
    field: col.field,
    title,
    aggFunc: true,
    colId: col.field,
    business_type: type,
    width: col.width || undefined,
    visible: col.visible,
    ...rendererManager.getColumnConfig(type, displayStructure, displayStructure)
  }
}

function buildColumn(col: ResolvedColumnConfigItem) {
  const fieldMeta = fieldMetaMap.value[col.field]
  const title = fieldMeta?.field_name_alias || col.field
  const displayStructure = {
    ...(fieldMeta?.display_structure || {}),
    ...(col.dateFormat ? { dateFormat: col.dateFormat } : {})
  }

  if (!fieldMeta && !col.businessType) {
    return {
      field: col.field,
      title,
      minWidth: 120,
      width: col.width || undefined,
      visible: col.visible
    }
  }

  if (isDateBusinessType(col.businessType || fieldMeta?.business_type)) {
    return buildDateColumn(col, title, displayStructure)
  }

  return buildTypedColumn(col, fieldMeta, title, displayStructure)
}

const gridOptions = computed<VxeGridProps>(() => ({
  border: true,
  stripe: true,
  resizable: true,
  showOverflow: true,
  size: 'small',
  columns: resolvedColumnConfig.value.map((col) => buildColumn(col)),
  pagerConfig: {
    enabled: true,
    currentPage: currentPage.value,
    pageSize: pageSize.value,
    total: total.value
  }
}))

function buildFilterConditions(): any[] {
  const filterRules = props.setting?.filterRules || []
  if (!filterRules.length) return []

  const value = filterRules
    .filter((rule: any) => rule.field && rule.operator)
    .map((rule: any) =>
      convertFilterRuleToCondition(
        { field: rule.field, operator: rule.operator, value: rule.value },
        isDateField
      )
    )
    .filter((rule: any) => (rule.column && rule.type) || rule.type === 'AND')

  return value.length ? [{ type: 'AND', value }] : []
}

function buildOrderBy(): any[] {
  const sortRules = props.setting?.sortRules || []
  const result = sortRules
    .filter((rule: any) => rule.field)
    .map((rule: any) => ({ column: rule.field, desc: rule.order === 'desc' }))

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
    const conditions = buildFilterConditions()
    const params: any = {
      tableId: props.setting.tableId,
      columns: [{ name: '*' }],
      orderBy: buildOrderBy(),
      pagination: {
        pageSize: pageSize.value,
        pageNum: currentPage.value
      }
    }
    if (conditions.length) params.conditions = conditions

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
  if (size) pageSize.value = size
  fetchData()
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  currentPage.value = 1
  emit('refreshSetting', newSetting)
}

function reloadTable() {
  currentPage.value = 1
  pageSize.value = props.setting?.rowLimit || 10
  fetchData()
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
    props.setting?.columnConfig,
    props.setting?.hiddenColumns,
    props.setting?.columnWidths
  ],
  reloadTable,
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  reloadTable
)

provide('viewTools', {
  getPageParams: null,
  columns: computed(() => gridOptions.value.columns),
  tableFields: computed(() => Object.values(fieldMetaMap.value))
})

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
