<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="560px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Columns">
        <el-select v-model="form.columns" multiple collapse-tags placeholder="Select columns" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <!-- Column config (width + visibility) -->
      <el-form-item v-if="form.columnConfig.length > 0" label="Column Settings">
        <div class="column-config-list">
          <div v-for="(col, index) in form.columnConfig" :key="col.field" class="column-config-item">
            <span class="column-name">{{ fieldLabel(col.field) }}</span>
            <div class="column-controls">
              <el-input-number
                v-model="col.width"
                :min="60"
                :max="800"
                :controls="false"
                size="small"
                style="width: 80px"
                placeholder="Auto"
              />
              <el-switch v-model="col.visible" size="small" active-text="Show" inactive-text="Hide" />
              <el-button link size="small" :disabled="index === 0" @click="moveColumn(index, -1)">
                <Icon name="lucide:arrow-up" size="14" />
              </el-button>
              <el-button link size="small" :disabled="index === form.columnConfig.length - 1" @click="moveColumn(index, 1)">
                <Icon name="lucide:arrow-down" size="14" />
              </el-button>
              <el-button link type="danger" size="small" @click="removeColumn(index)">
                <Icon name="lucide:x" size="14" />
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- Sort Rules -->
      <el-form-item label="Sort">
        <div class="rule-list">
          <div v-for="(rule, index) in form.sortRules" :key="index" class="rule-row">
            <el-select v-model="rule.field" placeholder="Field" size="small" style="flex: 1" :loading="fieldsLoading">
              <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
            </el-select>
            <el-select v-model="rule.order" size="small" style="width: 110px">
              <el-option label="Ascending" value="asc" />
              <el-option label="Descending" value="desc" />
            </el-select>
            <el-button link type="danger" size="small" @click="removeSortRule(index)">
              <Icon name="lucide:x" size="14" />
            </el-button>
          </div>
          <el-button link size="small" @click="addSortRule">
            <Icon name="lucide:plus" size="14" />
            Add sort
          </el-button>
        </div>
      </el-form-item>

      <!-- Filter Rules -->
      <el-form-item label="Filters">
        <div class="rule-list">
          <div v-for="(rule, index) in form.filterRules" :key="index" class="rule-row filter-rule-row">
            <el-select v-model="rule.field" placeholder="Field" size="small" style="flex: 1" :loading="fieldsLoading" @change="onFilterFieldChange(rule)">
              <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
            </el-select>
            <el-select v-model="rule.operator" placeholder="Op" size="small" style="width: 120px">
              <el-option v-for="op in getOperatorsForField(rule.field)" :key="op.value" :label="op.label" :value="op.value" />
            </el-select>
            <el-input
              v-if="!isValuelessOperator(rule.operator)"
              v-model="rule.value"
              placeholder="Value"
              size="small"
              style="flex: 1"
            />
            <span v-else style="flex: 1; color: var(--el-text-color-secondary); font-size: 12px; line-height: 24px;">—</span>
            <el-button link type="danger" size="small" @click="removeFilterRule(index)">
              <Icon name="lucide:x" size="14" />
            </el-button>
          </div>
          <el-button link size="small" @click="addFilterRule">
            <Icon name="lucide:plus" size="14" />
            Add filter
          </el-button>
        </div>
      </el-form-item>

      <el-form-item label="Row Limit">
        <el-select-v2 v-model="form.rowLimit" :options="limitOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Title">
        <el-input v-model="form.title" placeholder="e.g. Table View" />
      </el-form-item>

      <el-divider>Annotation</el-divider>

      <el-form-item label="Subtitle">
        <el-input v-model="form.subtitle" placeholder="e.g. Q1 2024 overview" />
      </el-form-item>

      <el-form-item label="Footer">
        <el-input v-model="form.footer" placeholder="e.g. Data refreshed daily" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="footer-grid">
        <el-button type="danger" @click="handleDelete">{{ $t('common_delete') }}</el-button>
        <el-button type="primary" @click="handleSubmit">{{ $t('common_submit') }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useWidgetSetting } from '../../composables/dashboard/useWidgetSetting'
import { useWidgetTableFields } from '../../composables/dashboard/useWidgetTableFields'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { isDateBusinessType, resolveDateFormat } from '../../utils/dashboardFieldMeta'

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields } = useWidgetTableFields()

const limitOptions = [
  { label: '5 rows', value: 5 },
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 }
]

interface SortRule {
  field: string
  order: 'asc' | 'desc'
}

interface FilterRule {
  field: string
  operator: string
  value: string
}

interface ColumnConfigItem {
  field: string
  width: number | undefined
  visible: boolean
  businessType: string
  dateFormat: string
}

const form = reactive({
  tableId: '',
  columns: [] as string[],
  columnConfig: [] as ColumnConfigItem[],
  rowLimit: 10,
  sortRules: [] as SortRule[],
  filterRules: [] as FilterRule[],
  title: '',
  subtitle: '',
  footer: ''
})

function resolveColumnMeta(fieldName: string, prev?: ColumnConfigItem) {
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  const businessType = String(field?.business_type ?? prev?.businessType ?? '')
  return {
    businessType,
    dateFormat: isDateBusinessType(businessType)
      ? (resolveDateFormat(field, undefined, '') || prev?.dateFormat || '')
      : ''
  }
}

function syncColumnConfig() {
  // Preserve existing config for fields that are still selected
  const existing = new Map(form.columnConfig.map((c) => [c.field, c]))
  form.columnConfig = form.columns.map((field) => {
    const prev = existing.get(field)
    const meta = resolveColumnMeta(field, prev)
    return {
      field,
      width: prev?.width ?? undefined,
      visible: prev?.visible ?? true,
      businessType: meta.businessType,
      dateFormat: meta.dateFormat
    }
  })
}

watch(() => form.columns, syncColumnConfig, { deep: true })

function fieldLabel(fieldName: string): string {
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  return field?.field_name_alias || fieldName
}

function moveColumn(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.columnConfig.length) return
  const cols = [...form.columnConfig]
  const temp = cols[index]
  cols[index] = cols[newIndex]
  cols[newIndex] = temp
  form.columnConfig = cols
  // Sync columns order
  form.columns = cols.map((c) => c.field)
}

function removeColumn(index: number) {
  const field = form.columnConfig[index]?.field
  form.columnConfig.splice(index, 1)
  const colIndex = form.columns.indexOf(field)
  if (colIndex !== -1) form.columns.splice(colIndex, 1)
}

function addSortRule() {
  form.sortRules.push({ field: '', order: 'desc' })
}

function removeSortRule(index: number) {
  form.sortRules.splice(index, 1)
}

function addFilterRule() {
  form.filterRules.push({ field: '', operator: '', value: '' })
}

function removeFilterRule(index: number) {
  form.filterRules.splice(index, 1)
}

function getFieldType(fieldName: string): string {
  const fromConfig = form.columnConfig.find((c) => c.field === fieldName)?.businessType
  if (fromConfig) return fromConfig
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  return field?.business_type || ''
}

function isDateField(fieldName: string): boolean {
  return isDateBusinessType(String(getFieldType(fieldName)))
}

function isNumericField(fieldName: string): boolean {
  const type = getFieldType(fieldName)
  return type === ColumnFieldType.Number || type === ColumnFieldType.Rating
}

function getOperatorsForField(fieldName: string): { label: string; value: string }[] {
  if (!fieldName) return []
  if (isDateField(fieldName)) {
    return [
      { label: 'Equals', value: 'EQ' },
      { label: 'After', value: 'GT' },
      { label: 'After or equals', value: 'GTE' },
      { label: 'Before', value: 'LT' },
      { label: 'Before or equals', value: 'LTE' },
      { label: 'Is empty', value: 'IS_NULL' },
      { label: 'Is not empty', value: 'IS_NOT_NULL' }
    ]
  }
  if (isNumericField(fieldName)) {
    return [
      { label: '=', value: 'EQ' },
      { label: '≠', value: 'NE' },
      { label: '>', value: 'GT' },
      { label: '≥', value: 'GTE' },
      { label: '<', value: 'LT' },
      { label: '≤', value: 'LTE' },
      { label: 'Is empty', value: 'IS_NULL' },
      { label: 'Is not empty', value: 'IS_NOT_NULL' }
    ]
  }
  return [
    { label: 'Contains', value: 'LIKE' },
    { label: 'Equals', value: 'EQ' },
    { label: 'Not equals', value: 'NE' },
    { label: 'Is empty', value: 'IS_NULL' },
    { label: 'Is not empty', value: 'IS_NOT_NULL' }
  ]
}

function isValuelessOperator(operator: string): boolean {
  return ['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE'].includes(operator)
}

function onFilterFieldChange(rule: FilterRule) {
  rule.operator = ''
  rule.value = ''
}

async function handleTableChange(tableId: string) {
  form.columns = []
  form.columnConfig = []
  form.sortRules = []
  form.filterRules = []
  await loadFields(tableId)
}

function restoreColumnConfig() {
  const savedConfig = setting.value.columnConfig
  const savedWidths = setting.value.columnWidths || {}
  const savedHidden = new Set(setting.value.hiddenColumns || [])

  if (Array.isArray(savedConfig) && savedConfig.length) {
    form.columnConfig = savedConfig.map((col: any) => ({
      field: col.field || '',
      width: col.width ?? savedWidths[col.field] ?? undefined,
      visible: col.visible ?? !savedHidden.has(col.field),
      businessType: String(col.businessType ?? ''),
      dateFormat: col.dateFormat || ''
    }))
    form.columns = form.columnConfig.map((c) => c.field)
    return
  }

  form.columns = setting.value.columns || []
  form.columnConfig = form.columns.map((field: string) => ({
    field,
    width: savedWidths[field] ?? undefined,
    visible: !savedHidden.has(field),
    businessType: '',
    dateFormat: ''
  }))
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      restoreColumnConfig()

      form.rowLimit = setting.value.rowLimit || 10
      const oldSortField = setting.value.sortField || ''
      const oldSortOrder = setting.value.sortOrder || 'desc'
      const existingSortRules = setting.value.sortRules || []
      if (existingSortRules.length) {
        form.sortRules = existingSortRules.map((r: any) => ({ field: r.field || '', order: r.order || 'desc' }))
      } else if (oldSortField) {
        form.sortRules = [{ field: oldSortField, order: oldSortOrder }]
      } else {
        form.sortRules = []
      }

      form.filterRules = (setting.value.filterRules || []).map((r: any) => ({
        field: r.field || '',
        operator: r.operator || '',
        value: r.value || ''
      }))
      form.title = setting.value.title || ''
      form.subtitle = setting.value.subtitle || ''
      form.footer = setting.value.footer || ''

      if (form.tableId) {
        await loadFields(form.tableId)
        // Backfill meta for legacy settings / newly selected fields
        if (form.columnConfig.some((c) => !c.businessType)) {
          syncColumnConfig()
        }
      }
    }
  }
)

function handleSubmit() {
  const columnWidths: Record<string, number> = {}
  const hiddenColumns: string[] = []
  const orderedFields: string[] = []
  const columnConfig = form.columnConfig.map((col) => {
    orderedFields.push(col.field)
    if (col.width) columnWidths[col.field] = col.width
    if (!col.visible) hiddenColumns.push(col.field)
    return {
      field: col.field,
      width: col.width,
      visible: col.visible,
      businessType: col.businessType,
      dateFormat: col.dateFormat
    }
  })

  baseSubmit({
    tableId: form.tableId,
    columns: orderedFields,
    columnConfig,
    columnWidths,
    hiddenColumns,
    rowLimit: form.rowLimit,
    sortRules: form.sortRules.filter((r) => r.field).map((r) => ({ field: r.field, order: r.order })),
    filterRules: form.filterRules
      .filter((r) => r.field && r.operator)
      .map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value
      })),
    sortField: undefined,
    sortOrder: undefined,
    title: form.title,
    subtitle: form.subtitle,
    footer: form.footer
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.column-config-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.column-config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover {
    background: var(--el-fill-color-light);
  }
}
.column-name {
  font-size: 14px;
}
.column-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rule-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-rule-row {
  flex-wrap: wrap;
}
.footer-grid {
  display: flex;
  justify-content: space-between;
}
</style>
