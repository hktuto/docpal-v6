<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="580px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <!-- Mode toggle -->
      <el-form-item label="Multi-segment Mode">
        <el-switch v-model="form.useSegments" />
      </el-form-item>

      <!-- Legacy single filter -->
      <template v-if="!form.useSegments">
        <el-form-item label="Filter Field">
          <el-select v-model="form.filterField" clearable placeholder="Select field" style="width: 100%" :loading="fieldsLoading" @change="handleFilterFieldChange">
            <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
          </el-select>
        </el-form-item>

        <el-form-item label="Filter Value">
          <el-select v-if="filterOptions.length > 0" v-model="form.filterValue" placeholder="Select value" style="width: 100%">
            <el-option v-for="opt in filterOptions" :key="opt.id" :label="opt.label" :value="opt.id" />
          </el-select>
          <el-input v-else v-model="form.filterValue" placeholder="e.g. completed" />
        </el-form-item>
      </template>

      <!-- Multi-segment config -->
      <template v-else>
        <div class="segment-list">
          <div v-for="(seg, index) in form.segments" :key="index" class="segment-card">
            <div class="segment-header">
              <el-input v-model="seg.label" placeholder="Segment label" size="small" style="flex: 1" />
              <el-color-picker v-model="seg.color" size="small" />
              <el-button link type="danger" size="small" @click="removeSegment(index)">
                <Icon name="lucide:trash-2" size="14" />
              </el-button>
            </div>
            <div class="segment-filters">
              <div v-for="(rule, rIndex) in seg.filterRules" :key="rIndex" class="rule-row filter-rule-row">
                <el-select v-model="rule.field" placeholder="Field" size="small" style="flex: 1" :loading="fieldsLoading" @change="onFilterFieldChange(rule)">
                  <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
                </el-select>
                <el-select v-model="rule.operator" placeholder="Op" size="small" style="width: 100px">
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
                <el-button link type="danger" size="small" @click="removeSegmentFilter(index, rIndex)">
                  <Icon name="lucide:x" size="14" />
                </el-button>
              </div>
              <el-button link size="small" @click="addSegmentFilter(index)">
                <Icon name="lucide:plus" size="14" />
                Add filter
              </el-button>
            </div>
          </div>
          <el-button link size="small" @click="addSegment">
            <Icon name="lucide:plus" size="14" />
            Add segment
          </el-button>
        </div>
      </template>

      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. Completion Rate" />
      </el-form-item>

      <el-divider>Annotation</el-divider>

      <el-form-item label="Subtitle">
        <el-input v-model="form.subtitle" placeholder="e.g. Q1 2024 overview" />
      </el-form-item>

      <el-form-item label="Footer">
        <el-input v-model="form.footer" placeholder="e.g. Data refreshed daily" />
      </el-form-item>

      <el-form-item v-if="!form.useSegments" label="Color">
        <el-select-v2 v-model="form.color" :options="colorOptions" style="width: 100%" />
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

const colorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' }
]

interface FilterRule {
  field: string
  operator: string
  value: string
}

interface Segment {
  label: string
  color: string
  filterRules: FilterRule[]
}

const form = reactive({
  tableId: '',
  useSegments: false,
  segments: [] as Segment[],
  filterField: '',
  filterValue: '',
  label: 'Progress',
  color: 'primary',
  subtitle: '',
  footer: ''
})

const filterOptions = computed(() => {
  const field = fields.value.find((f: any) => f.field_name === form.filterField)
  if (!field) return []
  const isSelect = field.business_type === '3' || field.business_type === '4' ||
    field.business_type === 'SingleSelect' || field.business_type === 'MultiSelect'
  if (!isSelect) return []
  const options = field.display_structure?.options || field.properties?.options || []
  return Array.isArray(options) ? options : []
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

function addSegment() {
  form.segments.push({
    label: `Segment ${form.segments.length + 1}`,
    color: '#409eff',
    filterRules: []
  })
}

function removeSegment(index: number) {
  form.segments.splice(index, 1)
}

function addSegmentFilter(segIndex: number) {
  form.segments[segIndex].filterRules.push({ field: '', operator: '', value: '' })
}

function removeSegmentFilter(segIndex: number, ruleIndex: number) {
  form.segments[segIndex].filterRules.splice(ruleIndex, 1)
}

async function handleTableChange(tableId: string) {
  form.filterField = ''
  form.filterValue = ''
  form.segments = []
  await loadFields(tableId)
}

function handleFilterFieldChange() {
  form.filterValue = ''
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.useSegments = !!setting.value.segments?.length
      form.segments = (setting.value.segments || []).map((s: any) => ({
        label: s.label || '',
        color: s.color || '#409eff',
        filterRules: (s.filterRules || []).map((r: any) => ({
          field: r.field || '',
          operator: r.operator || '',
          value: r.value || ''
        }))
      }))
      form.filterField = setting.value.filterField || ''
      form.filterValue = setting.value.filterValue || ''
      form.label = setting.value.label || 'Progress'
      form.color = setting.value.color || 'primary'
      form.subtitle = setting.value.subtitle || ''
      form.footer = setting.value.footer || ''
      if (form.tableId) {
        await loadFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  const payload: any = {
    tableId: form.tableId,
    label: form.label,
    subtitle: form.subtitle,
    footer: form.footer
  }

  if (form.useSegments) {
    payload.segments = form.segments
      .filter((s) => s.label)
      .map((s) => ({
        label: s.label,
        color: s.color,
        filterRules: s.filterRules
          .filter((r) => r.field && r.operator)
          .map((r) => ({ field: r.field, operator: r.operator, value: r.value }))
      }))
    payload.filterField = undefined
    payload.filterValue = undefined
    payload.color = undefined
  } else {
    payload.filterField = form.filterField
    payload.filterValue = form.filterValue
    payload.color = form.color
    payload.segments = undefined
  }

  baseSubmit(payload)
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.segment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: var(--app-space-s);
}
.segment-card {
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-s);
}
.segment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: var(--app-space-xs);
}
.segment-filters {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
