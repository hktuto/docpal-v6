<script lang="ts" setup>
import type { Table, View, Row, Column, SelectOption, FilterCondition, Database } from '../../../types/database'
import { useTable } from '../../../composables/useDatabase'
import { evaluateFormula } from '../../../utils/formulaEvaluator'
import { formatNumber as formatNumberValue, formatDate as formatDateValue, formatText as formatTextValue } from '../../../utils/displayFormatter'
import { useDebounceFn } from '@vueuse/core'
import RelationPopover from '../RelationPopover.vue'
import { Download } from '@element-plus/icons-vue'

const props = defineProps<{
  database: Database
  table: Table
  view: View
}>()

const emit = defineEmits<{
  openRecord: [tableId: string, recordId: string]
  create: []
  editColumn: [column: Column]
  addColumn: [position: 'left' | 'right', referenceColumn: Column]
}>()

const { queryRows, resolveRelation, resolveUser, deleteRow, calculateRollupValue } = useTable(props.database.id, props.table.id)

// Filter state
const filterRef = ref()
const searchQuery = ref<Record<string, any>>({})

// Export dialog state
const showExportDialog = ref(false)
const selectedExportFormat = ref<'hierarchical' | 'separate-sheets' | 'flat' | 'summary-detail'>('hierarchical')

// Get view-configured filters
const viewFilters = computed((): FilterCondition[] => {
  return props.view.config?.filters || []
})

// Get view-configured sorting
const viewSorting = computed(() => {
  return props.view.config?.sorting || []
})

// Get view-configured grouping
const viewGroupBy = computed(() => {
  return props.view.config?.groupBy || null
})

// Check if secondary grouping is enabled
const hasSecondaryGrouping = computed(() => {
  return viewGroupBy.value?.field && viewGroupBy.value?.secondaryField
})

// Compute active filters from search query (local UI filters)
const localFilters = computed(() => {
  const filters: FilterCondition[] = []
  
  // Skip the search input key (q)
  for (const [field, value] of Object.entries(searchQuery.value)) {
    if (field === 'q') continue // Skip search text field
    
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        filters.push({ field, operator: 'in', value })
      } else if (!Array.isArray(value)) {
        const column = props.table.columns.find(c => c.field === field)
        if (column?.type === 'text' || column?.type === 'textarea') {
          filters.push({ field, operator: 'contains', value })
        } else {
          filters.push({ field, operator: 'equals', value })
        }
      }
    }
  }
  return filters
})

// Combined filters: view config + local UI filters
const activeFilters = computed(() => {
  return [...viewFilters.value, ...localFilters.value]
})

// Get search text
const searchText = computed(() => searchQuery.value.q || '')

// Get related table by ID
function getRelatedTable(tableId: string) {
  return props.database.tables.find(t => t.id === tableId)
}

// Get visible columns from view config (sorted by order)
const visibleColumns = computed(() => {
  const viewColumns = props.view.columns || []
  
  // If no columns configured, show all table columns
  if (viewColumns.length === 0) {
    return props.table.columns.map((col, index) => ({
      ...col,
      _order: index,
      _visible: true,
      _sourceType: 'base' as const,
      _relationField: undefined as string | undefined,
      _uniqueField: col.field // Unique field name for slot
    }))
  }
  
  // Filter to visible columns and sort by order
  const visibleCols = viewColumns
    .filter(vc => vc.visible)
    .sort((a, b) => a.order - b.order)
  
  // Map to full column definitions
  return visibleCols.map(vc => {
    if (vc.sourceType === 'relation' && vc.relationField) {
      // Related column - find the column from the related table
      const relationCol = props.table.columns.find(c => c.field === vc.relationField)
      if (!relationCol?.relationConfig) return null
      
      const relatedTable = getRelatedTable(relationCol.relationConfig.tableId)
      const relatedCol = relatedTable?.columns.find(c => c.id === vc.columnId || c.field === vc.field)
      if (!relatedCol) return null
      
      return {
        ...relatedCol,
        _order: vc.order,
        _visible: vc.visible,
        _displayTitle: vc.displayTitle || `${relationCol.title} → ${relatedCol.title}`,
        _width: vc.width,
        _sourceType: 'relation' as const,
        _relationField: vc.relationField,
        _uniqueField: `${vc.relationField}__${relatedCol.field}` // Unique field name for slot
      }
    } else {
      // Base table column
      const tableCol = props.table.columns.find(c => c.id === vc.columnId || c.field === vc.field)
      if (!tableCol) return null
      
      return {
        ...tableCol,
        _order: vc.order,
        _visible: vc.visible,
        _displayTitle: vc.displayTitle,
        _width: vc.width,
        _sourceType: 'base' as const,
        _relationField: undefined as string | undefined,
        _uniqueField: tableCol.field // Unique field name for slot
      }
    }
  }).filter(Boolean) as (Column & { 
    _order: number
    _visible: boolean
    _displayTitle?: string
    _width?: number
    _sourceType: 'base' | 'relation'
    _relationField?: string
    _uniqueField: string
  })[]
})
const { highlightText } = useTextHighlight()
const vxeColumns = ref<any[]>([])
function setColumns() {

  const columnData = visibleColumns.value.map(col => {
    // Use custom title if set, otherwise use column title
    const displayTitle = (col as any)._displayTitle
    let titleWithIcon = displayTitle || col.title
    
    // Add icon for formula and aggregation columns
    if (col.type === 'fx') {
      titleWithIcon = `🔣 ${titleWithIcon}`
    } else if (col.type === 'rollup') {
      titleWithIcon = `∑ ${titleWithIcon}`
    }
    
    const colWidth = (col as any)._width
    const columnData:any = {
      field: (col as any)._uniqueField, // Use unique field name for related columns
      title: titleWithIcon,
      width: colWidth || col.width,
      minWidth: 120,
      sortable: (col as any)._sourceType === 'base', // Only base columns are sortable
      showOverflow: true,
      slots: {
        default: `cell_${(col as any)._uniqueField}`
      }
    }
    if(searchQuery.value.q && col.type === 'text' || col.type === 'textarea'){
      columnData.type = 'html';
      columnData.formatter = ({ cellValue, row }: any) => {
        return highlightText(cellValue, searchQuery.value.q)
      }
      delete columnData.slots
    }
    return columnData
  })
  vxeColumns.value = columnData
  tableConfig.columns = columnData
}


// Resolve a related field value from a row
function resolveRelatedFieldValue(row: Row, relationField: string, field: string): any {
  const relationCol = props.table.columns.find(c => c.field === relationField)
  if (!relationCol?.relationConfig) return null
  
  const relatedId = row[relationField]
  if (!relatedId) return null
  
  const relatedTable = getRelatedTable(relationCol.relationConfig.tableId)
  if (!relatedTable) return null
  
  // Handle multiple relations
  if (Array.isArray(relatedId)) {
    if (relatedId.length === 0) return null
    // Return first value or indicate multiple
    const firstRecord = relatedTable.rows.find(r => r.id === relatedId[0])
    if (relatedId.length > 1) {
      return `${firstRecord?.[field] || '-'} (+${relatedId.length - 1})`
    }
    return firstRecord?.[field] || null
  }
  
  // Single relation
  const relatedRecord = relatedTable.rows.find(r => r.id === relatedId)
  return relatedRecord?.[field] || null
}

// Group rows by field
interface GroupedData {
  groupValue: any
  groupLabel: string
  rows: Row[]
  count: number
  collapsed: boolean
}

const groupedRows = ref<GroupedData[]>([])
const collapsedGroups = ref<Set<string>>(new Set())


async function getAllDataAndCreateUniqueOptions(column: Column) {
  const result = queryRows({
    search: searchText.value,
    filters: activeFilters.value,
    sort: viewSorting.value,
    page: 1,
    pageSize: 10000
  })
  const uniqueOptions = [...new Set(result.map(row => row[column.field]))]
  return uniqueOptions.sort((a,b) => a.localeCompare(b)).map(option => ({
    label: option,
    value: option
  }))
}

// Mock API function for useVxeTable
async function mockTableApi(params: any) {
  const { page } = params
  const result = queryRows({
    search: searchText.value,
    filters: activeFilters.value,
    sort: viewSorting.value,
    page: page?.currentPage || 1,
    pageSize: page?.pageSize || 300
  })
  
  // If grouping is enabled, organize data into groups
  if (viewGroupBy.value?.field) {
    organizeGroupedData()
  }
  
  return result
}

// Calculate aggregation for a group of rows
function calculateAggregation(rows: Row[], field: string, type: 'sum' | 'avg' | 'min' | 'max' | 'count'): number {
  if (type === 'count') {
    return rows.length
  }
  
  // Find the column to check if it's a rollup field
  const column = props.table.columns.find(c => c.field === field)
  
  const values = rows
    .map(row => {
      let value = row[field]
      
      // For rollup fields, calculate the value if not already present
      if (column?.type === 'rollup' && column.rollupConfig && (value === undefined || value === null)) {
        value = calculateRollupValue(column, row)
      }
      
      return typeof value === 'number' ? value : parseFloat(value)
    })
    .filter(v => !isNaN(v))
  
  if (values.length === 0) return 0
  
  switch (type) {
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0)
    case 'avg':
      return values.reduce((sum, val) => sum + val, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return 0
  }
}

// Format aggregation label
function formatAggregationLabel(type: 'sum' | 'avg' | 'min' | 'max' | 'count'): string {
  const labels = {
    sum: ' ',
    avg: '⌀',
    min: 'Min',
    max: 'Max',
    count: '#'
  }
  return labels[type]
}

// Get footer data for a group (Level 1 aggregations)
function getGroupFooterData(columns: any[], data: any[], group: any): any[][] {
  if (!viewGroupBy.value?.aggregations || viewGroupBy.value.aggregations.length === 0) {
    return []
  }
  
  // Filter out group nodes if secondary grouping is enabled
  const actualRows = hasSecondaryGrouping.value 
    ? data.filter(row => !row._isGroupNode) 
    : data
  
  // Create footer row
  const footerRow: any = {}
  
  // First column shows "Total" label
  const firstVisibleColumn = visibleColumns.value[0]
  if (firstVisibleColumn) {
    footerRow[firstVisibleColumn._uniqueField] = 'Total'
  }
  
  // Calculate aggregations for configured fields
  viewGroupBy.value.aggregations.forEach(agg => {
    const column = props.table.columns.find(c => c.field === agg.field)
    if (column) {
      const value = calculateAggregation(actualRows, agg.field, agg.type)
      const visCol = visibleColumns.value.find(vc => vc.field === column.field)
      
      if (visCol) {
        const formattedValue = formatNumberValue(value, column)
        const label = formatAggregationLabel(agg.type)
        footerRow[visCol._uniqueField] = `${label} ${formattedValue}`
      }
    }
  })
  
  return [footerRow]
}

// Format group label based on column type
function formatGroupLabel(key: string, column: Column): string {
  if (key === '__empty__') {
    return '(Empty)'
  } else if (column.type === 'single-select') {
    const option = column.options?.find(o => o.id === key)
    return option?.label || key
  } else if (column.type === 'user') {
    const user = resolveUser(key)
    return user?.name || key
  } else if (column.type === 'checkbox' || column.type === 'switch') {
    return key === 'true' ? '✓ Yes' : '✗ No'
  } else if (column.type === 'relation' && column.relationConfig) {
    // Resolve relation label
    const label = resolveRelation(column.relationConfig.tableId, key, column.relationConfig.displayField)
    return Array.isArray(label) ? label.join(', ') : String(label || key)
  }
  return key
}

// Organize rows into groups
function organizeGroupedData() {
  if (!viewGroupBy.value?.field) {
    groupedRows.value = []
    return
  }
  console.log('organizeGroupedData')
  const rows = queryRows({
    search: searchText.value,
    filters: activeFilters.value,
    sort: viewSorting.value,
  })
  const groupField = viewGroupBy.value.field
  const groupColumn = props.table.columns.find(c => c.field === groupField)
  if (!groupColumn) {
    groupedRows.value = []
    return
  }
  
  // Group rows by field value
  const groups = new Map<any, Row[]>()
  
  for (const row of rows) {
    let value = row[groupField]
    
    // Handle relation fields - extract first ID if multiple
    if (groupColumn.type === 'relation' && Array.isArray(value)) {
      value = value.length > 0 ? value[0] : null
    }
    
    const key = value === null || value === undefined ? '__empty__' : String(value)
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(row)
  }
  
  // Convert to array and add labels
  groupedRows.value = Array.from(groups.entries()).map(([key, groupRows]) => {
    const groupLabel = formatGroupLabel(key, groupColumn)
    
    // If secondary grouping is enabled, transform rows for tree structure
    let processedRows = groupRows
    if (hasSecondaryGrouping.value) {
      processedRows = transformRowsForTreeGrouping(groupRows)
    }
    
    return {
      groupValue: key,
      groupLabel,
      rows: processedRows,
      count: groupRows.length,
      collapsed: collapsedGroups.value.has(key)
    }
  })
  
  // Sort groups: non-empty first, then alphabetically
  groupedRows.value.sort((a, b) => {
    if (a.groupValue === '__empty__') return 1
    if (b.groupValue === '__empty__') return -1
    return a.groupLabel.localeCompare(b.groupLabel)
  })
}

// Transform rows into tree structure for secondary grouping
function transformRowsForTreeGrouping(rows: Row[]): any[] {
  const secondaryField = viewGroupBy.value?.secondaryField
  if (!secondaryField) return rows
  
  const secondaryColumn = props.table.columns.find(c => c.field === secondaryField)
  if (!secondaryColumn) return rows
  
  // Group by secondary field
  const secondaryGroups = new Map<string, Row[]>()
  
  for (const row of rows) {
    let value = row[secondaryField]
    
    // Handle relation fields - extract first ID if multiple
    if (secondaryColumn.type === 'relation' && Array.isArray(value)) {
      value = value.length > 0 ? value[0] : null
    }
    
    const key = value === null || value === undefined ? '__empty__' : String(value)
    
    if (!secondaryGroups.has(key)) {
      secondaryGroups.set(key, [])
    }
    secondaryGroups.get(key)!.push(row)
  }
  
  // Convert to flat tree structure with parent-child relationships
  const treeData: any[] = []
  
  for (const [key, groupRows] of secondaryGroups.entries()) {
    const groupLabel = formatGroupLabel(key, secondaryColumn)
    
    // Create parent group node with all required fields
    const parentId = `group-${key}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    const parentNode: any = {
      id: parentId,
      _isGroupNode: true,
      _groupLabel: groupLabel,
      _groupCount: groupRows.length,
      _treeNodeKey: parentId
    }
    
    // Add null/empty values for all table columns to prevent VxeTable errors
    props.table.columns.forEach(col => {
      if (!parentNode[col.field]) {
        parentNode[col.field] = null
      }
    })
    
    // Calculate aggregations for number fields
    const aggregations = viewGroupBy.value?.aggregations || []
    aggregations.forEach(agg => {
      const column = props.table.columns.find(c => c.field === agg.field)
      if (column && (column.type === 'number' || column.type === 'rollup' || column.type === 'fx')) {
        const value = calculateAggregation(groupRows, agg.field, agg.type)
        parentNode[agg.field] = value
        parentNode[`_agg_${agg.field}`] = {
          value,
          type: agg.type,
          label: formatAggregationLabel(agg.type)
        }
      }
    })
    
    treeData.push(parentNode)
    
    // Add children rows with parent reference
    groupRows.forEach(row => {
      treeData.push({
        ...row,
        _parentId: parentId,
        _treeNodeKey: row.id
      })
    })
  }
  
  return treeData
}

// Get tree config for VxeTable
function getTreeConfig() {
  return {
    transform: true,
    rowField: '_treeNodeKey',
    parentField: '_parentId',
    expandAll: true,
    accordion: false,
    line: true,
    showIcon: true,
    iconOpen: 'vxe-icon-square-minus',
    iconClose: 'vxe-icon-square-plus'
  }
}

// Toggle group collapse
function toggleGroupCollapse(groupValue: string) {
  if (collapsedGroups.value.has(groupValue)) {
    collapsedGroups.value.delete(groupValue)
  } else {
    collapsedGroups.value.add(groupValue)
  }
  
  // Re-organize to update collapsed state
  const $table = tableRef.value as any
  const currentData = $table?.getTableData?.()
  if (currentData?.fullData) {
    organizeGroupedData()
  }
}

// // Header actions for column context menu
// const headerActions = computed(() => {
//   return [
//     [
//       {
//         code: 'edit-column',
//         name: 'Edit Column',
//         action: (params: any) => {
//           const col = props.table.columns.find(c => c.field === params.column?.field)
//           if (col) {
//             emit('editColumn', col)
//           }
//         }
//       },
//       {
//         code: 'add-column-left',
//         name: 'Add Column to Left',
//         action: (params: any) => {
//           const col = props.table.columns.find(c => c.field === params.column?.field)
//           if (col) {
//             emit('addColumn', 'left', col)
//           }
//         }
//       },
//       {
//         code: 'add-column-right',
//         name: 'Add Column to Right',
//         action: (params: any) => {
//           const col = props.table.columns.find(c => c.field === params.column?.field)
//           if (col) {
//             emit('addColumn', 'right', col)
//           }
//         }
//       }
//     ]
//   ] as any
// })

// Use project standard useVxeTable
const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: `database-table-${props.table.id}`,
  columns: [],
  api: mockTableApi,
  virtualScroll: true,
  headerActions: [
    [
      {
        code: 'edit-column',
        name: 'Edit Column',
        action: (params: any) => {
          // const col = props.table.columns.find(c => c.field === params.column?.field)
          // if (col) {
          //   emit('editColumn', col)
          // }
        }
      },
      {
        code: 'add-column-left',
        name: 'Add Column to Left',
        action: (params: any) => {
          // const col = props.table.columns.find(c => c.field === params.column?.field)
          // if (col) {
          //   emit('addColumn', 'left', col)
          // }
        }
      },
      {
        code: 'add-column-right',
        name: 'Add Column to Right',
        action: (params: any) => {
          // const col = props.table.columns.find(c => c.field === params.column?.field)
          // if (col) {
          //   emit('addColumn', 'right', col)
          // }
        }
      }
    ]
  ],
  dblClickAction: ({ row }: { row: Row }) => {
    emit('openRecord', props.table.id, row.id)
  },
  bodyActions: [
    [
      {
        code: 'edit',
        name: 'Edit',
        action: ({ row }: { row: Row }) => {
          emit('openRecord', props.table.id, row.id)
        }
      },
      {
        code: 'delete',
        name: 'Delete',
        action: ({ row }: { row: Row }) => {
          handleDelete(row)
        }
      }
    ]
  ]
})

// Watch search query to reload table
const debouncedReload = useDebounceFn(reload, 300)
const debouncedOrganizeGroupedData = useDebounceFn(organizeGroupedData, 300)
watch(searchQuery, async() => {
  await setColumns()
  // check is viewing in group mode
  if(viewGroupBy.value?.field){
    debouncedOrganizeGroupedData()
  }else{
    debouncedReload()
  }
}, { deep: true })

// Watch view config changes (filters/sorting from ViewSettingsDrawer)
watch(
  () => [props.view.config?.filters, props.view.config?.sorting],
  () => {
    if(viewGroupBy.value?.field){
      debouncedOrganizeGroupedData()
    }else{
      debouncedReload()
    }
  },
  { deep: true }
)

// Watch view columns changes (visibility/order from ViewSettingsDrawer)
watch(
  () => props.view.columns,
  () => {
    setColumns()
    // Force re-render of the grid when columns change
    if(viewGroupBy.value?.field){
      debouncedOrganizeGroupedData()
    }else{
      debouncedReload()
    }
  },
  { deep: true }
)

// Initialize filters on mount
onMounted(async() => {
  setColumns()
  await initializeFilters()
  if(viewGroupBy.value?.field){
      debouncedOrganizeGroupedData()
    }else{
      debouncedReload()
    }
})

// Initialize ResponsiveFilter with column filters
async function initializeFilters() {
  const filterList: any[] = []
  
  for (const column of props.table.columns) {
    const options = await getFilterOptions(column)
    if (options.length > 0) {
      filterList.push({
        label: column.title,
        key: column.field,
        isMultiple: true,
        options
      })
    }
  }
  
  if (filterRef.value && filterList.length > 0) {
    filterRef.value.init(filterList)
  }
}

// Get filter options for a column
async function getFilterOptions(column: Column): { label: string; value: any }[] {
  switch (column.type) {
    case 'single-select':
      return column.options?.map(opt => ({ label: opt.label, value: opt.id })).sort((a,b) => a.label.localeCompare(b.label)) || []
    case 'checkbox':
    case 'switch':
      return [
        { label: 'Yes', value: true },
        { label: 'No', value: false }
      ]
    case 'user':
      // Get all unique users from the table data
      const users = new Set<string>()
      props.table.rows.forEach(row => {
        if (row[column.field]) users.add(row[column.field])
      })
      return Array.from(users).map(userId => {
        const user = resolveUser(userId)
        return { label: user?.name || userId, value: userId }
      }).sort((a,b) => a.label.localeCompare(b.label))
    case 'relation':
      // Get all unique relations from the table data
      if (!column.relationConfig) return []
      const relations = new Set<string>()
      props.table.rows.forEach(row => {
        const value = row[column.field]
        if (Array.isArray(value)) {
          value.forEach(v => relations.add(v))
        } else if (value) {
          relations.add(value)
        }
      })
      return Array.from(relations).map(relId => {
        const label = resolveRelation(column.relationConfig!.tableId, relId, column.relationConfig!.displayField)
        // Ensure label is a string
        const labelStr = Array.isArray(label) ? label.join(', ') : String(label || relId)
        return { label: labelStr, value: relId }
      }).sort((a,b) => a.label.localeCompare(b.label))
    case 'text': 
      const options = await getAllDataAndCreateUniqueOptions(column)
      return options
      // get all data and create unique options
    default:
      return []
  }
}

// Handle filter form change
function handleFilterFormChange(form: any) {
  searchQuery.value = form
}

// Handlers
function handleDelete(row: Row) {
  if (confirm('Are you sure you want to delete this record?')) {
    deleteRow(row.id)
    reload()
  }
}

// Export to Excel
function handleExportExcel() {
  // If grouped view, show format selection dialog
  if (viewGroupBy.value?.field) {
    showExportDialog.value = true
  } else {
    // For non-grouped view, export directly
    exportDefault()
  }
}

function exportDefault() {
  const $table = tableRef.value as any
  if (!$table) return

  // Export configuration
  $table.exportData({
    filename: `${props.table.name}_${new Date().toISOString().split('T')[0]}`,
    type: 'xlsx',
    mode: 'current'
  })
}

function confirmExport() {
  showExportDialog.value = false
  
  switch (selectedExportFormat.value) {
    case 'hierarchical':
      exportHierarchical()
      break
    case 'separate-sheets':
      exportSeparateSheets()
      break
    case 'flat':
      exportFlat()
      break
    case 'summary-detail':
      exportSummaryDetail()
      break
  }
}

// Export Format 1: Hierarchical with visual grouping
async function exportHierarchical() {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.default.Workbook()
  const worksheet = workbook.addWorksheet(props.table.name)
  
  // Add header row
  const headerRow = worksheet.addRow(visibleColumns.value.map(col => col.title))
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  let currentRow = 2
  
  // Process each primary group
  for (const group of groupedRows.value) {
    // Add primary group header
    const groupHeaderRow = worksheet.getRow(currentRow)
    groupHeaderRow.getCell(1).value = `${group.groupLabel} (${group.count})`
    groupHeaderRow.font = { bold: true, size: 11 }
    groupHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0E4F7' }
    }
    worksheet.mergeCells(currentRow, 1, currentRow, visibleColumns.value.length)
    currentRow++
    
    // If secondary grouping, process sub-groups
    if (hasSecondaryGrouping.value) {
      const actualRows = group.rows.filter((r: any) => !r._isGroupNode)
      const secondaryField = viewGroupBy.value!.secondaryField!
      const secondaryColumn = props.table.columns.find(c => c.field === secondaryField)
      
      // Group by secondary field
      const secondaryGroups = new Map<string, any[]>()
      for (const row of actualRows) {
        let value = row[secondaryField]
        if (secondaryColumn?.type === 'relation' && Array.isArray(value)) {
          value = value.length > 0 ? value[0] : null
        }
        const key = value === null || value === undefined ? '__empty__' : String(value)
        if (!secondaryGroups.has(key)) {
          secondaryGroups.set(key, [])
        }
        secondaryGroups.get(key)!.push(row)
      }
      
      // Process each secondary group
      for (const [key, subGroupRows] of secondaryGroups.entries()) {
        const subGroupLabel = formatGroupLabel(key, secondaryColumn!)
        
        // Add secondary group header
        const subHeaderRow = worksheet.getRow(currentRow)
        subHeaderRow.getCell(1).value = `  ${subGroupLabel} (${subGroupRows.length})`
        subHeaderRow.font = { bold: true }
        subHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        }
        worksheet.mergeCells(currentRow, 1, currentRow, visibleColumns.value.length)
        currentRow++
        
        // Add data rows
        for (const row of subGroupRows) {
          const rowData = visibleColumns.value.map(col => formatCellValue(row[col.field], col))
          const dataRow = worksheet.addRow(rowData)
          dataRow.outlineLevel = 2
          currentRow++
        }
        
        // Add L2 aggregation row
        if (viewGroupBy.value?.aggregations && viewGroupBy.value.aggregations.length > 0) {
          const subtotalRow = worksheet.getRow(currentRow)
          subtotalRow.getCell(1).value = '    Subtotal'
          subtotalRow.font = { bold: true, italic: true }
          
          viewGroupBy.value.aggregations.forEach(agg => {
            const column = props.table.columns.find(c => c.field === agg.field)
            if (column) {
              const value = calculateAggregation(subGroupRows, agg.field, agg.type)
              const colIndex = visibleColumns.value.findIndex(vc => vc.field === column.field)
              if (colIndex >= 0) {
                const formattedValue = formatNumberValue(value, column)
                const label = formatAggregationLabel(agg.type)
                subtotalRow.getCell(colIndex + 1).value = `${label} ${formattedValue}`
              }
            }
          })
          currentRow++
        }
      }
    } else {
      // No secondary grouping, just add rows
      for (const row of group.rows) {
        const rowData = visibleColumns.value.map(col => formatCellValue(row[col.field], col))
        const dataRow = worksheet.addRow(rowData)
        dataRow.outlineLevel = 1
        currentRow++
      }
    }
    
    // Add L1 aggregation row (total for primary group)
    if (viewGroupBy.value?.aggregations && viewGroupBy.value.aggregations.length > 0) {
      const actualRows = hasSecondaryGrouping.value 
        ? group.rows.filter((r: any) => !r._isGroupNode)
        : group.rows
      
      const totalRow = worksheet.getRow(currentRow)
      totalRow.getCell(1).value = '  Total'
      totalRow.font = { bold: true, size: 11, color: { argb: 'FF0066CC' } }
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F2FF' }
      }
      
      viewGroupBy.value.aggregations.forEach(agg => {
        const column = props.table.columns.find(c => c.field === agg.field)
        if (column) {
          const value = calculateAggregation(actualRows, agg.field, agg.type)
          const colIndex = visibleColumns.value.findIndex(vc => vc.field === column.field)
          if (colIndex >= 0) {
            const formattedValue = formatNumberValue(value, column)
            const label = formatAggregationLabel(agg.type)
            totalRow.getCell(colIndex + 1).value = `${label} ${formattedValue}`
          }
        }
      })
      currentRow++
    }
    
    // Add spacing between groups
    currentRow++
  }
  
  // Auto-fit columns
  worksheet.columns.forEach((column: any) => {
    column.width = 20
  })
  
  // Export file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.table.name}_hierarchical_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

// Export Format 2: Separate sheets per primary group
async function exportSeparateSheets() {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.default.Workbook()
  
  // Create a sheet for each primary group
  for (const group of groupedRows.value) {
    const worksheet = workbook.addWorksheet(group.groupLabel.substring(0, 31)) // Excel sheet name limit
    
    // Add header row
    const headerRow = worksheet.addRow(visibleColumns.value.map(col => col.title))
    headerRow.font = { bold: true, size: 12 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }
    
    const actualRows = hasSecondaryGrouping.value 
      ? group.rows.filter((r: any) => !r._isGroupNode)
      : group.rows
    
    // Add data rows
    for (const row of actualRows) {
      const rowData = visibleColumns.value.map(col => formatCellValue(row[col.field], col))
      worksheet.addRow(rowData)
    }
    
    // Add total row
    if (viewGroupBy.value?.aggregations && viewGroupBy.value.aggregations.length > 0) {
      const totalRow = worksheet.addRow([])
      totalRow.getCell(1).value = 'Total'
      totalRow.font = { bold: true }
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFEB9C' }
      }
      
      viewGroupBy.value.aggregations.forEach(agg => {
        const column = props.table.columns.find(c => c.field === agg.field)
        if (column) {
          const value = calculateAggregation(actualRows, agg.field, agg.type)
          const colIndex = visibleColumns.value.findIndex(vc => vc.field === column.field)
          if (colIndex >= 0) {
            const formattedValue = formatNumberValue(value, column)
            const label = formatAggregationLabel(agg.type)
            totalRow.getCell(colIndex + 1).value = `${label} ${formattedValue}`
          }
        }
      })
    }
    
    // Auto-fit columns
    worksheet.columns.forEach((column: any) => {
      column.width = 20
    })
  }
  
  // Export file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.table.name}_by_groups_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

// Export Format 3: Flat format with group columns
async function exportFlat() {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.default.Workbook()
  const worksheet = workbook.addWorksheet(props.table.name)
  
  // Get group field names
  const primaryGroupField = props.table.columns.find(c => c.field === viewGroupBy.value?.field)
  const secondaryGroupField = hasSecondaryGrouping.value 
    ? props.table.columns.find(c => c.field === viewGroupBy.value?.secondaryField)
    : null
  
  // Build headers with group columns
  const headers = [primaryGroupField?.title || 'Group']
  if (secondaryGroupField) {
    headers.push(secondaryGroupField.title)
  }
  headers.push(...visibleColumns.value.map(col => col.title))
  
  const headerRow = worksheet.addRow(headers)
  headerRow.font = { bold: true, size: 12 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  // Add data rows
  for (const group of groupedRows.value) {
    const actualRows = hasSecondaryGrouping.value 
      ? group.rows.filter((r: any) => !r._isGroupNode)
      : group.rows
    
    for (const row of actualRows) {
      const rowData = [group.groupLabel]
      
      if (secondaryGroupField) {
        const secValue = row[secondaryGroupField.field]
        rowData.push(formatCellValue(secValue, secondaryGroupField))
      }
      
      rowData.push(...visibleColumns.value.map(col => formatCellValue(row[col.field], col)))
      worksheet.addRow(rowData)
    }
  }
  
  // Auto-fit columns
  worksheet.columns.forEach((column: any) => {
    column.width = 20
  })
  
  // Export file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.table.name}_flat_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

// Export Format 4: Summary + Detail sheets
async function exportSummaryDetail() {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.default.Workbook()
  
  // Sheet 1: Summary
  const summarySheet = workbook.addWorksheet('Summary')
  const primaryGroupField = props.table.columns.find(c => c.field === viewGroupBy.value?.field)
  
  // Summary headers
  const summaryHeaders = [primaryGroupField?.title || 'Group', 'Count']
  if (viewGroupBy.value?.aggregations) {
    viewGroupBy.value.aggregations.forEach(agg => {
      const col = props.table.columns.find(c => c.field === agg.field)
      if (col) {
        const label = formatAggregationLabel(agg.type)
        summaryHeaders.push(`${label} ${col.title}`)
      }
    })
  }
  
  const summaryHeaderRow = summarySheet.addRow(summaryHeaders)
  summaryHeaderRow.font = { bold: true, size: 12 }
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  // Add summary rows
  for (const group of groupedRows.value) {
    const actualRows = hasSecondaryGrouping.value 
      ? group.rows.filter((r: any) => !r._isGroupNode)
      : group.rows
    
    const summaryRow = [group.groupLabel, actualRows.length]
    
    if (viewGroupBy.value?.aggregations) {
      viewGroupBy.value.aggregations.forEach(agg => {
        const value = calculateAggregation(actualRows, agg.field, agg.type)
        const column = props.table.columns.find(c => c.field === agg.field)
        if (column) {
          summaryRow.push(formatNumberValue(value, column))
        }
      })
    }
    
    summarySheet.addRow(summaryRow)
  }
  
  summarySheet.columns.forEach((column: any) => {
    column.width = 20
  })
  
  // Sheet 2: Details
  const detailSheet = workbook.addWorksheet('Details')
  
  const detailHeaders = [primaryGroupField?.title || 'Group', ...visibleColumns.value.map(col => col.title)]
  const detailHeaderRow = detailSheet.addRow(detailHeaders)
  detailHeaderRow.font = { bold: true, size: 12 }
  detailHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  
  // Add detail rows
  for (const group of groupedRows.value) {
    const actualRows = hasSecondaryGrouping.value 
      ? group.rows.filter((r: any) => !r._isGroupNode)
      : group.rows
    
    for (const row of actualRows) {
      const rowData = [group.groupLabel, ...visibleColumns.value.map(col => formatCellValue(row[col.field], col))]
      detailSheet.addRow(rowData)
    }
  }
  
  detailSheet.columns.forEach((column: any) => {
    column.width = 20
  })
  
  // Export file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${props.table.name}_summary_detail_${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}

// Cell value formatters
function formatCellValue(value: any, column: Column): string {
  if (value === null || value === undefined) return '-'
  
  switch (column.type) {
    case 'date':
      return formatDateValue(value, column)
    case 'number':
      return formatNumberValue(value, column)
    case 'text':
    case 'textarea':
      return formatTextValue(value, column)
    case 'single-select':
      return getSelectLabel(value, column.options)
    case 'checkbox':
    case 'switch':
      return value ? '✓' : '✗'
    case 'rating':
      const max = column.maxRating || 5
      return '★'.repeat(value || 0) + '☆'.repeat(max - (value || 0))
    case 'attachment':
      return Array.isArray(value) ? `${value.length} file(s)` : '-'
    default:
      return String(value)
  }
}

function getSelectLabel(value: string, options?: SelectOption[]): string {
  if (!options) return value
  const option = options.find(o => o.id === value)
  return option?.label || value
}

function getSelectColor(value: string, options?: SelectOption[]): string {
  if (!options) return '#6b7280'
  const option = options.find(o => o.id === value)
  return option?.color || '#6b7280'
}

// Evaluate formula for a row
function evaluateFormulaForRow(column: Column, row: Row): { value: number | null; error: string | null } {
  if (!column.fxConfig?.expression) {
    return { value: null, error: 'No formula defined' }
  }
  
  // Build context from row data
  const context: Record<string, any> = {}
  for (const col of props.table.columns) {
    if (col.id !== column.id) {
      context[col.field] = row[col.field]
    }
  }
  
  return evaluateFormula(column.fxConfig.expression, context)
}

// Format formula result for display
function formatFormulaResult(column: Column, row: Row): string {
  const result = evaluateFormulaForRow(column, row)
  
  if (result.error) {
    return '⚠️'
  }
  
  if (result.value === null) {
    return '-'
  }
  
  // Use display formatter for formula results (they inherit number display config)
  return formatNumberValue(result.value, column)
}

// Format rollup result for display
function formatRollupValue(column: Column, row: Row): string {
  const value = calculateRollupValue(column, row)
  
  if (value === null || value === undefined) {
    return '-'
  }
  
  // For date aggregations (earliest, latest)
  if (column.rollupConfig?.aggregation === 'earliest' || column.rollupConfig?.aggregation === 'latest') {
    return formatDateValue(value as string, column)
  }
  
  // For numeric aggregations
  if (typeof value === 'number') {
    return formatNumberValue(value, column)
  }
  
  return String(value)
}
</script>

<template>
  <div class="table-view">
    <!-- Grouped View -->
    <div v-if="viewGroupBy?.field" class="grouped-table-view">
      <!-- Toolbar -->
      <div class="grouped-toolbar">
        <ResponsiveFilter
          ref="filterRef"
          input-key="q"
          input-place-holder="Search..."
          @form-change="handleFilterFormChange"
        />
        
      </div>
      
      <!-- Groups -->
      <div class="groups-container">
        <div
          v-for="group in groupedRows"
          :key="group.groupValue"
          class="group-section"
        >
          <!-- Group Header -->
          <div 
            class="group-header"
            @click="toggleGroupCollapse(group.groupValue)"
          >
            <span class="group-expand-icon">
              {{ group.collapsed ? '▶' : '▼' }}
            </span>
            <span class="group-title">{{ group.groupLabel }}</span>
            <span class="group-count">{{ group.count }} Records</span>
          </div>
          
          <!-- Group Content (Table) -->
          <div v-if="!group.collapsed" class="group-content">
            <vxe-grid
              :data="group.rows"
              :columns="vxeColumns"
              border
              show-overflow
              :row-config="{ isHover: true, useKey:true }"
              :auto-resize="true"
              max-height="500"
              :tree-config="hasSecondaryGrouping ? getTreeConfig() : undefined"
              :sort-config="{ trigger: 'cell', remote: false }"
              :show-footer="viewGroupBy?.aggregations && viewGroupBy.aggregations.length > 0"
              :footer-method="({ columns, data }) => getGroupFooterData(columns, data, group)"
              @cell-dblclick="({ row }) => emit('openRecord', props.table.id, row.id)"
            >
            <template #toolbar_buttons>
              <el-button
                type="primary"
                :icon="Download"
                @click="handleExportExcel"
              >
                Export Excel here
              </el-button>
            </template>
              <!-- Dynamic cell slots for visible columns -->
              <template v-for="(column, colIndex) in visibleColumns" :key="column._uniqueField" #[`cell_${column._uniqueField}`]="{ row }">
                <!-- Group node in first column (for secondary grouping) -->
                <template v-if="row._isGroupNode && colIndex === 0">
                  <span class="tree-group-label">
                    <strong>{{ row._groupLabel }}</strong>
                    <span class="tree-group-count">({{ row._groupCount }})</span>
                  </span>
                </template>
                
                <!-- Aggregated values for group nodes in other columns -->
                <template v-else-if="row._isGroupNode">
                  <span v-if="row[`_agg_${column.field}`]" class="aggregation-value">
                    <span class="agg-label">{{ row[`_agg_${column.field}`].label }}</span>
                    <span class="agg-number">{{ formatNumberValue(row[`_agg_${column.field}`].value, column) }}</span>
                  </span>
                  <span v-else></span>
                </template>
                
                <!-- Related column (from linked table) -->
                <template v-if="column._sourceType === 'relation' && column._relationField">
                  <span class="related-value">
                    {{ resolveRelatedFieldValue(row, column._relationField, column.field) ?? '-' }}
                  </span>
                </template>
                
                <!-- Base column: Single Select with color badge -->
                <template v-else-if="column.type === 'single-select'">
                  <el-tag
                    v-if="row[column.field]"
                    :style="{ backgroundColor: getSelectColor(row[column.field], column.options) + '20', color: getSelectColor(row[column.field], column.options), borderColor: getSelectColor(row[column.field], column.options) }"
                    size="small"
                  >
                    {{ getSelectLabel(row[column.field], column.options) }}
                  </el-tag>
                  <span v-else>-</span>
                </template>

                <!-- Base column: User -->
                <template v-else-if="column.type === 'user'">
                  <div v-if="row[column.field]" class="user-cell">
                    <el-avatar :size="24" :src="resolveUser(row[column.field])?.avatar" />
                    <span v-html="highlightText(resolveUser(row[column.field])?.name ?? '', searchQuery.q)"></span>
                  </div>
                  <span v-else>-</span>
                </template>

                <!-- Base column: Relation (Read-only) -->
                <template v-else-if="column.type === 'relation'">
                  <div class="relation-cell">
                    <template v-if="column.relationConfig?.multiple && Array.isArray(row[column.field])">
                      <RelationPopover
                        v-for="relId in row[column.field].slice(0, 2)"
                        :key="relId"
                        :database-id="database.id"
                        :table-id="column.relationConfig.tableId"
                        :record-id="relId"
                        :display-field="column.relationConfig.displayField"
                        @view-record="(tableId, recordId) => $emit('openRecord', tableId, recordId)"
                      >
                        <el-tag
                          size="small"
                          type="info"
                          class="relation-tag"
                        >
                          {{ resolveRelation(column.relationConfig.tableId, relId, column.relationConfig.displayField) }}
                        </el-tag>
                      </RelationPopover>
                      <el-tag v-if="row[column.field].length > 2" size="small" type="info">
                        +{{ row[column.field].length - 2 }}
                      </el-tag>
                    </template>
                    <template v-else-if="row[column.field]">
                      <RelationPopover
                        :database-id="database.id"
                        :table-id="column.relationConfig!.tableId"
                        :record-id="row[column.field]"
                        :display-field="column.relationConfig!.displayField"
                        @view-record="(tableId, recordId) => $emit('openRecord', tableId, recordId)"
                      >
                        <el-tag
                          size="small"
                          type="info"
                          class="relation-tag"
                        >
                          {{ resolveRelation(column.relationConfig!.tableId, row[column.field], column.relationConfig!.displayField) }}
                        </el-tag>
                      </RelationPopover>
                    </template>
                    <span v-else>-</span>
                  </div>
                </template>

                <!-- URL -->
                <template v-else-if="column.type === 'url'">
                  <el-link v-if="row[column.field]" :href="row[column.field]" target="_blank" type="primary">
                    {{ row[column.field] }}
                  </el-link>
                  <span v-else>-</span>
                </template>

                <!-- Email -->
                <template v-else-if="column.type === 'email'">
                  <el-link v-if="row[column.field]" :href="`mailto:${row[column.field]}`" type="primary">
                    <span v-html="highlightText(row[column.field], searchQuery.q)"></span>
                  </el-link>
                  <span v-else>-</span>
                </template>

                <!-- Rating -->
                <template v-else-if="column.type === 'rating'">
                  <el-rate v-model="row[column.field]" disabled :max="column.maxRating || 5" />
                </template>

                <!-- Switch/Checkbox -->
                <template v-else-if="column.type === 'switch' || column.type === 'checkbox'">
                  <el-tag :type="row[column.field] ? 'success' : 'info'" size="small">
                    {{ row[column.field] ? '✓' : '✗' }}
                  </el-tag>
                </template>

                <!-- Formula (fx) - Calculated -->
                <template v-else-if="column.type === 'fx'">
                  <span class="fx-cell" :title="column.fxConfig?.expression">
                    {{ formatFormulaResult(column, row) }}
                  </span>
                </template>

                <!-- Rollup - Aggregated from related records -->
                <template v-else-if="column.type === 'rollup'">
                  <span class="rollup-cell" :title="`${column.rollupConfig?.aggregation} of related records`">
                    {{ formatRollupValue(column, row) }}
                  </span>
                </template>

                <!-- Default -->
                <template v-else>
                  {{ formatCellValue(row[column.field], column) }}
                </template>
              </template>
            </vxe-grid>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Regular Table View (No Grouping) -->
    <vxe-grid
      v-else
      ref="tableRef"
      v-bind="tableConfig"
      v-on="tableEvent"
    >
      <!-- Toolbar -->
      <template #toolbar_buttons>
        <div class="toolbar-content">
          <ResponsiveFilter
            ref="filterRef"
            input-key="q"
            input-place-holder="Search..."
            @form-change="handleFilterFormChange"
          />
          <el-button
            type="primary"
            :icon="Download"
            @click="handleExportExcel"
          >
            Export Excel
          </el-button>
        </div>
      </template>

      <!-- Dynamic cell slots for visible columns -->
      <template v-for="(column, colIndex) in visibleColumns" :key="column._uniqueField" #[`cell_${column._uniqueField}`]="{ row }">
        <!-- Group node in first column (for secondary grouping in regular view) -->
        <template v-if="row._isGroupNode && colIndex === 0">
          <span class="tree-group-label">
            <strong>{{ row._groupLabel }}</strong>
            <span class="tree-group-count">({{ row._groupCount }})</span>
          </span>
        </template>
        
        <!-- Aggregated values for group nodes in other columns -->
        <template v-else-if="row._isGroupNode">
          <span v-if="row[`_agg_${column.field}`]" class="aggregation-value">
            <span class="agg-label">{{ row[`_agg_${column.field}`].label }}</span>
            <span class="agg-number">{{ formatNumberValue(row[`_agg_${column.field}`].value, column) }}</span>
          </span>
          <span v-else></span>
        </template>
        
        <!-- Related column (from linked table) -->
        <template v-if="column._sourceType === 'relation' && column._relationField">
          <span class="related-value">
            {{ resolveRelatedFieldValue(row, column._relationField, column.field) ?? '-' }}
          </span>
        </template>
        
        <!-- Base column: Single Select with color badge -->
        <template v-else-if="column.type === 'single-select'">
          <el-tag
            v-if="row[column.field]"
            :style="{ backgroundColor: getSelectColor(row[column.field], column.options) + '20', color: getSelectColor(row[column.field], column.options), borderColor: getSelectColor(row[column.field], column.options) }"
            size="small"
          >
            {{ getSelectLabel(row[column.field], column.options) }}
          </el-tag>
          <span v-else>-</span>
        </template>

        <!-- Base column: User -->
        <template v-else-if="column.type === 'user'">
          <div v-if="row[column.field]" class="user-cell">
            <el-avatar :size="24" :src="resolveUser(row[column.field])?.avatar" />
            <template v-if="searchQuery && searchQuery.q">
              <span v-html="highlightText(resolveUser(row[column.field])?.name || '', searchQuery.q || '')"></span>
            </template>
            <template v-else>
              {{ resolveUser(row[column.field])?.name }}
            </template>
          </div>
          <span v-else>-</span>
        </template>

        <!-- Base column: Relation (Read-only) -->
        <template v-else-if="column.type === 'relation'">
          <div class="relation-cell">
            <template v-if="column.relationConfig?.multiple && Array.isArray(row[column.field])">
              <RelationPopover
                v-for="relId in row[column.field].slice(0, 2)"
                :key="relId"
                :database-id="database.id"
                :table-id="column.relationConfig.tableId"
                :record-id="relId"
                :display-field="column.relationConfig.displayField"
                @view-record="(tableId, recordId) => $emit('openRecord', tableId, recordId)"
              >
                <el-tag
                  size="small"
                  type="info"
                  class="relation-tag"
                >
                  {{ resolveRelation(column.relationConfig.tableId, relId, column.relationConfig.displayField) }}
                </el-tag>
              </RelationPopover>
              <el-tag v-if="row[column.field].length > 2" size="small" type="info">
                +{{ row[column.field].length - 2 }}
              </el-tag>
            </template>
            <template v-else-if="row[column.field]">
              <RelationPopover
                :database-id="database.id"
                :table-id="column.relationConfig!.tableId"
                :record-id="row[column.field]"
                :display-field="column.relationConfig!.displayField"
                @view-record="(tableId, recordId) => $emit('openRecord', tableId, recordId)"
              >
                <el-tag
                  size="small"
                  type="info"
                  class="relation-tag"
                >
                  {{ resolveRelation(column.relationConfig!.tableId, row[column.field], column.relationConfig!.displayField) }}
                </el-tag>
              </RelationPopover>
            </template>
            <span v-else>-</span>
          </div>
        </template>

        <!-- URL -->
        <template v-else-if="column.type === 'url'">
          <el-link v-if="row[column.field]" :href="row[column.field]" target="_blank" type="primary">
            {{ row[column.field] }}
          </el-link>
          <span v-else>-</span>
        </template>

        <!-- Email -->
        <template v-else-if="column.type === 'email'">
          <el-link v-if="row[column.field]" :href="`mailto:${row[column.field]}`" type="primary">
            <template v-if="searchQuery && searchQuery.q">
              <span v-html="highlightText(row[column.field], searchQuery.q)"></span>
            </template>
            <template v-else>
              {{ row[column.field] }}
            </template>
          </el-link>
          <span v-else>-</span>
        </template>

        <!-- Rating -->
        <template v-else-if="column.type === 'rating'">
          <el-rate v-model="row[column.field]" disabled :max="column.maxRating || 5" />
        </template>

        <!-- Switch/Checkbox -->
        <template v-else-if="column.type === 'switch' || column.type === 'checkbox'">
          <el-tag :type="row[column.field] ? 'success' : 'info'" size="small">
            {{ row[column.field] ? '✓' : '✗' }}
          </el-tag>
        </template>

        <!-- Formula (fx) - Calculated -->
        <template v-else-if="column.type === 'fx'">
          <span class="fx-cell" :title="column.fxConfig?.expression">
            {{ formatFormulaResult(column, row) }}
          </span>
        </template>

        <!-- Rollup - Aggregated from related records -->
        <template v-else-if="column.type === 'rollup'">
          <span class="rollup-cell" :title="`${column.rollupConfig?.aggregation} of related records`">
            {{ formatRollupValue(column, row) }}
          </span>
        </template>

        <!-- Default -->
        <template v-else>
          {{ formatCellValue(row[column.field], column) }}
        </template>
      </template>
    </vxe-grid>
  </div>
  
  <!-- Export Format Selection Dialog -->
  <el-dialog
    v-model="showExportDialog"
    title="Export Excel - Choose Format"
    width="600px"
  >
    <div class="export-options">
      <el-radio-group v-model="selectedExportFormat" class="export-format-group">
        <el-radio value="hierarchical" class="export-option">
          <div class="option-content">
            <div class="option-title">📊 Hierarchical with Aggregations</div>
            <div class="option-description">
              Preserves grouping structure with visual hierarchy, includes both Level 1 (totals) and Level 2 (subtotals) aggregations. Best for viewing and presentations.
            </div>
            <div class="option-preview">
              <code>▼ Group 1 → Subgroup A → Data → Subtotal → Total</code>
            </div>
          </div>
        </el-radio>
        
        <el-radio value="separate-sheets" class="export-option">
          <div class="option-content">
            <div class="option-title">📑 Separate Sheets per Group</div>
            <div class="option-description">
              Each primary group gets its own worksheet with totals. Easy to distribute sheets to different people or teams.
            </div>
            <div class="option-preview">
              <code>Sheet: "Alice Chen" | Sheet: "Bob Smith"</code>
            </div>
          </div>
        </el-radio>
        
        <el-radio value="flat" class="export-option">
          <div class="option-content">
            <div class="option-title">📋 Flat Format with Group Columns</div>
            <div class="option-description">
              All data in flat format with group identifier columns. Perfect for importing into other tools or creating pivot tables.
            </div>
            <div class="option-preview">
              <code>Group | Subgroup | Data | Data | Data...</code>
            </div>
          </div>
        </el-radio>
        
        <el-radio value="summary-detail" class="export-option">
          <div class="option-content">
            <div class="option-title">📈 Summary + Detail Sheets</div>
            <div class="option-description">
              Two sheets: Summary with aggregations only, and Details with all data. Best for executive reports and analysis.
            </div>
            <div class="option-preview">
              <code>Sheet 1: Summary | Sheet 2: All Details</code>
            </div>
          </div>
        </el-radio>
      </el-radio-group>
    </div>
    
    <template #footer>
      <el-button @click="showExportDialog = false">Cancel</el-button>
      <el-button type="primary" :icon="Download" @click="confirmExport">
        Export
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.table-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  :deep(.vxe-grid--toolbar-wrapper){
    padding-inline: var(--app-space-s);
  }
}

.toolbar-content {
  display: flex;
  flex-flow: row nowrap;
  gap: var(--app-space-s);
  align-items: center;
  width: 100%;
}

// Grouped view styles
.grouped-table-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.grouped-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
  align-items: center;
  padding: var(--app-space-s);
  background: var(--app-bg-color);
  border-bottom: 1px solid var(--app-border-color);
}

.groups-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-s);
}

.group-section {
  margin-bottom: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
  background: var(--app-bg-color);
}

.group-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color-light);
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
  
  &:hover {
    background: var(--app-fill-color);
  }
}

.group-expand-icon {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  transition: transform 0.2s ease;
  width: 12px;
  display: inline-block;
}

.group-title {
  flex: 0 0 auto;
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.group-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
  background: var(--app-fill-color);
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
}

.group-content {
  padding: var(--app-space-s);
  
  :deep(.vxe-grid) {
    border: none !important;
    
    .vxe-table {
      height: auto !important;
      min-height: 100px;
    }
    
    .vxe-table--main-wrapper {
      height: auto !important;
    }
    
    .vxe-table--body-wrapper {
      overflow-y: auto !important;
      max-height: 500px;
    }
  }
}

// Cell styles
.user-cell {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.relation-cell {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xxs);
}

.relation-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

.fx-cell {
  font-family: var(--app-font-family-mono, monospace);
  color: var(--app-primary-color);
  cursor: help;
}

.rollup-cell {
  font-weight: 600;
  color: var(--app-success-color);
  cursor: help;
}

.related-value {
  color: var(--app-text-color-secondary);
  font-style: italic;
}

// Tree grouping styles
.tree-group-label {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  
  strong {
    font-weight: 600;
  }
}

.tree-group-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-placeholder);
  font-weight: 400;
}

// Aggregation value styles
.aggregation-value {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  color: var(--app-primary-color);
  background: var(--app-primary-color-light-9);
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
  
  .agg-label {
    font-size: var(--app-font-size-xs);
    opacity: 0.8;
  }
  
  .agg-number {
    font-size: var(--app-font-size-m);
  }
}

// Customize tree node appearance
:deep(.vxe-table) {
  .vxe-body--row.row--level-0 {
    // First level tree nodes (group nodes)
    background: var(--app-fill-color-lighter);
    
    &:hover {
      background: var(--app-fill-color-light);
    }
    
    .vxe-cell {
      font-weight: 500;
    }
  }
  
  .vxe-body--row.row--level-1 {
    // Second level (actual data rows)
    background: var(--app-bg-color);
  }
  
  .vxe-tree-cell {
    .vxe-tree--btn-wrapper {
      .vxe-tree--node-btn {
        color: var(--app-primary-color);
      }
    }
  }
  
  // Footer styling for Level 1 aggregations
  .vxe-footer--row {
    background: var(--app-fill-color-lighter) !important;
    font-weight: 600;
    
    .vxe-footer--column {
      border-top: 2px solid var(--app-border-color) !important;
      color: var(--app-text-color-primary) !important;
      
      &:first-child {
        color: var(--app-primary-color) !important;
        font-weight: 700;
      }
    }
  }
}

// Export dialog styles
.export-options {
  padding: var(--app-space-m) 0;
}

.export-format-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
}

.export-option {
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-m);
  margin: 0 !important;
  width: 100%;
  height: auto !important;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-fill-color-lighter);
  }
  
  :deep(.el-radio__input) {
    align-self: flex-start;
    margin-top: 4px;
  }
  
  :deep(.el-radio__label) {
    width: 100%;
    padding-left: var(--app-space-s);
  }
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.option-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.option-description {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  line-height: 1.5;
}

.option-preview {
  margin-top: var(--app-space-xs);
  padding: var(--app-space-xs);
  background: var(--app-fill-color);
  border-radius: var(--app-border-radius-s);
  
  code {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-placeholder);
    font-family: var(--app-font-family-mono, monospace);
  }
}
</style>

