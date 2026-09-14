<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="420px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. Sales by Region" />
      </el-form-item>

      <el-divider>Annotation</el-divider>

      <el-form-item label="Subtitle">
        <el-input v-model="form.subtitle" placeholder="e.g. Q1 2024 overview" />
      </el-form-item>

      <el-form-item label="Footer">
        <el-input v-model="form.footer" placeholder="e.g. Data refreshed daily" />
      </el-form-item>

      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Chart Type">
        <el-select-v2 v-model="form.chartType" :options="chartTypeOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Category Field (Slices)">
        <el-select
          v-model="form.categoryField"
          placeholder="Select field"
          style="width: 100%"
          :loading="fieldsLoading"
          @change="handleCategoryFieldChange"
        >
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Aggregation">
        <el-select-v2 v-model="form.aggregation" :options="aggregationOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item v-if="form.aggregation !== 'count'" label="Value Field">
        <el-select v-model="form.valueField" placeholder="Select numeric field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in numericFields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
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
import {
  buildFieldTypeMeta,
  createEmptyFieldTypeMeta,
  type FieldTypeMeta
} from '../../utils/dashboardFieldMeta'

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields, numericFields } = useWidgetTableFields()

const chartTypeOptions = [
  { label: 'Pie', value: 'pie' },
  { label: 'Donut', value: 'donut' }
]

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' }
]

const limitOptions = [
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 }
]

const form = reactive({
  tableId: '',
  chartType: 'pie',
  categoryField: '',
  categoryFieldMeta: createEmptyFieldTypeMeta() as FieldTypeMeta,
  valueField: '',
  aggregation: 'count',
  rowLimit: 20,
  label: '',
  appearance: {
    innerRadius: 0,
    outerRadius: 70,
    showPercentage: true,
    showAbsolute: true,
    bucketThreshold: 0
  },
  subtitle: '',
  footer: ''
})

function findField(fieldName: string) {
  return fields.value.find((f: any) => f.field_name === fieldName)
}

function syncCategoryFieldMeta(fieldName: string, keepPrev = false) {
  if (!fieldName) {
    form.categoryFieldMeta = createEmptyFieldTypeMeta()
    return
  }
  form.categoryFieldMeta = buildFieldTypeMeta(
    findField(fieldName),
    keepPrev ? form.categoryFieldMeta : undefined
  )
}

function handleCategoryFieldChange(fieldName: string) {
  syncCategoryFieldMeta(fieldName)
}

async function handleTableChange(tableId: string) {
  form.categoryField = ''
  form.valueField = ''
  syncCategoryFieldMeta('')
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      const raw = setting.value
      form.tableId = raw.tableId || ''
      form.chartType = raw.chartType || 'pie'
      form.categoryField = raw.categoryField || ''
      form.categoryFieldMeta = {
        businessType: raw.categoryFieldMeta?.businessType || '',
        dateFormat: raw.categoryFieldMeta?.dateFormat || ''
      }
      form.valueField = raw.valueField || ''
      form.aggregation = raw.aggregation || 'count'
      form.rowLimit = raw.rowLimit || 20
      form.label = raw.label || ''
      form.appearance = {
        innerRadius: raw.appearance?.innerRadius ?? (raw.chartType === 'donut' ? 40 : 0),
        outerRadius: raw.appearance?.outerRadius ?? 70,
        showPercentage: raw.appearance?.showPercentage ?? true,
        showAbsolute: raw.appearance?.showAbsolute ?? true,
        bucketThreshold: raw.appearance?.bucketThreshold ?? 0
      }
      form.subtitle = raw.subtitle || ''
      form.footer = raw.footer || ''
      if (form.tableId) {
        await loadFields(form.tableId)
        if (form.categoryField && !form.categoryFieldMeta.businessType) {
          syncCategoryFieldMeta(form.categoryField, true)
        }
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    chartType: form.chartType,
    categoryField: form.categoryField,
    categoryFieldMeta: { ...form.categoryFieldMeta },
    valueField: form.valueField,
    aggregation: form.aggregation,
    rowLimit: form.rowLimit,
    label: form.label,
    appearance: { ...form.appearance },
    subtitle: form.subtitle,
    footer: form.footer
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.appearance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.footer-grid {
  display: flex;
  justify-content: space-between;
}
</style>
