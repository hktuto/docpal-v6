<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="520px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Aggregation">
        <el-select-v2 v-model="form.aggregation" :options="aggregationOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item v-if="form.aggregation !== 'count'" label="Numeric Field">
        <el-select v-model="form.field" placeholder="Select a numeric field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in numericFields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <!-- Value Filters -->
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

      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. Total Sales" />
      </el-form-item>

      <el-divider>Annotation</el-divider>

      <el-form-item label="Subtitle">
        <el-input v-model="form.subtitle" placeholder="e.g. Q1 2024 overview" />
      </el-form-item>

      <el-form-item label="Footer">
        <el-input v-model="form.footer" placeholder="e.g. Data refreshed daily" />
      </el-form-item>

      <el-form-item label="Conditional Color">
        <el-switch v-model="form.conditionalColor" />
      </el-form-item>

      <el-form-item label="Show Progress Bar">
        <el-switch v-model="form.showProgress" />
      </el-form-item>

      <!-- Target / Total config -->
      <template v-if="form.showProgress || form.conditionalColor">
        <el-form-item label="Target Mode">
          <el-select-v2 v-model="form.targetMode" :options="targetModeOptions" style="width: 100%" />
        </el-form-item>

        <el-form-item v-if="form.targetMode === 'filtered'" label="Target Filters">
          <div class="rule-list">
            <div v-for="(rule, index) in form.targetFilterRules" :key="index" class="rule-row filter-rule-row">
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
              <el-button link type="danger" size="small" @click="removeTargetFilterRule(index)">
                <Icon name="lucide:x" size="14" />
              </el-button>
            </div>
            <el-button link size="small" @click="addTargetFilterRule">
              <Icon name="lucide:plus" size="14" />
              Add filter
            </el-button>
          </div>
        </el-form-item>
      </template>

      <el-form-item label="Color">
        <el-select-v2 v-model="form.color" :options="colorOptions" style="width: 100%" :disabled="form.conditionalColor" />
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
const { tableOptions, numericFields, fields, fieldsLoading, loadFields } = useWidgetTableFields()

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' }
]

const colorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' }
]

const targetModeOptions = [
  { label: 'Total Records', value: 'total' },
  { label: 'Filtered Count', value: 'filtered' }
]

interface FilterRule {
  field: string
  operator: string
  value: string
}

const form = reactive({
  tableId: '',
  aggregation: 'count',
  field: '',
  filterRules: [] as FilterRule[],
  label: 'Records',
  color: 'primary',
  subtitle: '',
  footer: '',
  conditionalColor: false,
  showProgress: false,
  targetMode: 'total' as 'total' | 'filtered',
  targetFilterRules: [] as FilterRule[]
})

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

function addFilterRule() {
  form.filterRules.push({ field: '', operator: '', value: '' })
}

function removeFilterRule(index: number) {
  form.filterRules.splice(index, 1)
}

function addTargetFilterRule() {
  form.targetFilterRules.push({ field: '', operator: '', value: '' })
}

function removeTargetFilterRule(index: number) {
  form.targetFilterRules.splice(index, 1)
}

async function handleTableChange(tableId: string) {
  form.field = ''
  form.filterRules = []
  form.targetFilterRules = []
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.aggregation = setting.value.aggregation || 'count'
      form.field = setting.value.field || ''
      form.filterRules = (setting.value.filterRules || []).map((r: any) => ({
        field: r.field || '',
        operator: r.operator || '',
        value: r.value || ''
      }))
      form.label = setting.value.label || 'Records'
      form.color = setting.value.color || 'primary'
      form.subtitle = setting.value.subtitle || ''
      form.footer = setting.value.footer || ''
      form.conditionalColor = setting.value.conditionalColor || false
      form.showProgress = setting.value.showProgress || false
      form.targetMode = setting.value.targetMode || 'total'
      form.targetFilterRules = (setting.value.targetFilterRules || []).map((r: any) => ({
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
    aggregation: form.aggregation,
    field: form.field,
    filterRules: form.filterRules
      .filter((r) => r.field && r.operator)
      .map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value
      })),
    label: form.label,
    color: form.color,
    subtitle: form.subtitle,
    footer: form.footer,
    conditionalColor: form.conditionalColor,
    showProgress: form.showProgress,
    targetMode: form.targetMode,
    targetFilterRules: form.targetFilterRules
      .filter((r) => r.field && r.operator)
      .map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value
      })),
    // Clear legacy static target
    target: undefined
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
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
