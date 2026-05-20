<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="520px" @close="handleClose">
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

      <!-- Column Order -->
      <el-form-item v-if="orderedColumns.length > 0 && !form.groupBy" label="Column Order">
        <div class="column-order-list">
          <div v-for="(col, index) in orderedColumns" :key="col" class="column-order-item">
            <span class="column-name">{{ fieldLabel(col) }}</span>
            <div class="column-actions">
              <el-button link size="small" :disabled="index === 0" @click="moveColumn(index, -1)">
                <Icon name="lucide:arrow-up" size="14" />
              </el-button>
              <el-button link size="small" :disabled="index === orderedColumns.length - 1" @click="moveColumn(index, 1)">
                <Icon name="lucide:arrow-down" size="14" />
              </el-button>
              <el-button link type="danger" size="small" @click="removeColumn(index)">
                <Icon name="lucide:x" size="14" />
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <!-- Group By -->
      <el-form-item label="Group By">
        <el-select v-model="form.groupBy" clearable placeholder="Select field to group" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
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

const form = reactive({
  tableId: '',
  columns: [] as string[],
  rowLimit: 10,
  groupBy: '',
  sortRules: [] as SortRule[],
  filterRules: [] as FilterRule[]
})

const orderedColumns = computed(() => form.columns)

function fieldLabel(fieldName: string): string {
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  return field?.field_name_alias || fieldName
}

function moveColumn(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.columns.length) return
  const cols = [...form.columns]
  const temp = cols[index]
  cols[index] = cols[newIndex]
  cols[newIndex] = temp
  form.columns = cols
}

function removeColumn(index: number) {
  form.columns.splice(index, 1)
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
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  return field?.business_type || ''
}

function isDateField(fieldName: string): boolean {
  const type = getFieldType(fieldName)
  return type === ColumnFieldType.DateTime || type === '5'
}

function isNumericField(fieldName: string): boolean {
  const type = getFieldType(fieldName)
  return type === ColumnFieldType.Number || type === '2' || type === ColumnFieldType.Rating || type === '12'
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
  form.groupBy = ''
  form.sortRules = []
  form.filterRules = []
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.columns = setting.value.columns || []
      form.rowLimit = setting.value.rowLimit || 10
      form.groupBy = setting.value.groupBy || ''

      // Migrate old sortField/sortOrder to sortRules
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

      if (form.tableId) {
        await loadFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    columns: [...form.columns],
    rowLimit: form.rowLimit,
    groupBy: form.groupBy,
    sortRules: form.sortRules.filter((r) => r.field).map((r) => ({ field: r.field, order: r.order })),
    filterRules: form.filterRules
      .filter((r) => r.field && r.operator)
      .map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value
      })),
    // Clear legacy sort fields when sortRules are used
    sortField: undefined,
    sortOrder: undefined
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.column-order-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 8px;
}
.column-order-item {
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
.column-actions {
  display: flex;
  gap: 4px;
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
