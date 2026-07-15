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
}
</style>
