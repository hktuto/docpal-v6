<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="520px" @close="handleClose">
    <el-form label-position="top">
      <!-- Table -->
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Title">
        <el-input v-model="form.title" placeholder="Widget title" />
      </el-form-item>

      <!-- Annotation -->
      <el-divider>Annotation</el-divider>
      <div class="appearance-grid">
        <el-form-item label="Subtitle">
          <el-input v-model="form.subtitle" placeholder="Widget subtitle" />
        </el-form-item>
        <el-form-item label="Footer">
          <el-input v-model="form.footer" placeholder="Widget footer annotation" />
        </el-form-item>
      </div>

      <!-- X-Axis Grouping -->
      <el-divider>X-Axis (Horizontal Grouping)</el-divider>

      <el-form-item label="Field">
        <el-select
          v-model="form.xField"
          placeholder="Select field to group by"
          style="width: 100%"
          :loading="fieldsLoading"
          @change="handleXFieldChange"
        >
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <!-- Series -->
      <el-divider>Data Series (Y-Axis Values)</el-divider>
      <div v-for="(series, index) in form.series" :key="index" class="series-row">
        <div class="series-header">
          <span class="series-title">Series {{ index + 1 }}</span>
          <el-button v-if="form.series.length > 1" type="danger" link size="small" @click="removeSeries(index)">
            Remove
          </el-button>
        </div>
        <div class="series-fields">
          <el-form-item label="Field" class="series-field-item">
            <el-select
              v-model="series.field"
              :placeholder="series.aggregation === 'count' ? 'Optional — count all rows' : 'Select numeric field'"
              style="width: 100%"
              :loading="fieldsLoading"
              clearable
            >
              <el-option
                v-for="f in (series.aggregation === 'count' ? fields : numericFields)"
                :key="f.field_name"
                :label="f.field_name_alias || f.field_name"
                :value="f.field_name"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Aggregation" class="series-field-item">
            <el-select-v2 v-model="series.aggregation" :options="aggregationOptions" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Type" class="series-field-item">
            <el-select-v2 v-model="series.type" :options="seriesTypeOptions" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Label" class="series-field-item">
            <el-input v-model="series.label" placeholder="Series label" />
          </el-form-item>
          <el-form-item label="Color" class="series-field-item">
            <el-color-picker v-model="series.color" show-alpha />
          </el-form-item>
        </div>
      </div>
      <el-button type="primary" link @click="addSeries">+ Add Series</el-button>

      <!-- Appearance -->
      <el-divider>Appearance</el-divider>
      <div class="appearance-grid">
        <el-form-item label="Legend Position">
          <el-select-v2 v-model="form.appearance.legendPosition" :options="legendPositionOptions" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Orientation">
          <el-select-v2 v-model="form.appearance.orientation" :options="[{ label: 'Vertical', value: 'vertical' }, { label: 'Horizontal', value: 'horizontal' }]" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="showStackedOption" label="Stacked">
          <el-switch v-model="form.appearance.stacked" />
        </el-form-item>
        <el-form-item v-if="showSmoothOption" label="Smooth Lines">
          <el-switch v-model="form.appearance.smooth" />
        </el-form-item>
        <el-form-item label="Data Labels">
          <el-switch v-model="form.appearance.showDataLabels" />
        </el-form-item>
      </div>

      <el-divider>Y-Axis Format</el-divider>
      <div class="appearance-grid">
        <el-form-item label="Precision">
          <el-input-number v-model="form.appearance.yAxisFormat.precision" :min="0" :max="6" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Prefix">
          <el-input v-model="form.appearance.yAxisFormat.prefix" placeholder="e.g. $" />
        </el-form-item>
        <el-form-item label="Suffix">
          <el-input v-model="form.appearance.yAxisFormat.suffix" placeholder="e.g. %" />
        </el-form-item>
      </div>

      <el-divider>Reference Lines</el-divider>
      <div v-for="(line, index) in form.appearance.referenceLines" :key="index" class="series-row">
        <div class="series-fields">
          <el-form-item label="Value" class="series-field-item">
            <el-input-number v-model="line.value" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Label" class="series-field-item">
            <el-input v-model="line.label" placeholder="Line label" />
          </el-form-item>
          <el-form-item label="Style" class="series-field-item">
            <el-select-v2 v-model="line.lineStyle" :options="[{ label: 'Dashed', value: 'dashed' }, { label: 'Solid', value: 'solid' }, { label: 'Dotted', value: 'dotted' }]" style="width: 100%" />
          </el-form-item>
          <el-form-item label="Color" class="series-field-item">
            <el-color-picker v-model="line.color" />
          </el-form-item>
        </div>
        <el-button type="danger" link size="small" @click="form.appearance.referenceLines.splice(index, 1)">Remove</el-button>
      </div>
      <el-button type="primary" link @click="form.appearance.referenceLines.push({ value: 0, label: '', lineStyle: 'dashed', color: '#999' })">+ Add Reference Line</el-button>
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

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields, numericFields, isDateField } = useWidgetTableFields()

const seriesTypeOptions = [
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' },
  { label: 'Scatter', value: 'scatter' }
]

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' }
]

const legendPositionOptions = [
  { label: 'None', value: 'none' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' }
]

function createDefaultSeries(): any {
  return {
    field: '',
    aggregation: 'sum',
    type: 'bar',
    label: '',
    color: ''
  }
}

function createEmptyXFieldMeta() {
  return {
    businessType: '',
    dateFormat: ''
  }
}

const form = reactive({
  tableId: '',
  xField: '',
  xFieldMeta: createEmptyXFieldMeta(),
  series: [createDefaultSeries()] as any[],
  appearance: {
    legendPosition: 'bottom',
    stacked: false,
    smooth: false,
    orientation: 'vertical',
    showDataLabels: false,
    yAxisFormat: { precision: 0, prefix: '', suffix: '' },
    referenceLines: [] as any[]
  },
  title: '',
  subtitle: '',
  footer: ''
})

function syncXFieldMeta(fieldName: string) {
  if (!fieldName) {
    form.xFieldMeta = createEmptyXFieldMeta()
    return
  }
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  form.xFieldMeta = {
    businessType: String(field?.business_type ?? ''),
    dateFormat: isDateField(fieldName)
      ? (field?.display_structure?.dateFormat || field?.properties?.dateFormat || '')
      : ''
  }
}

function handleXFieldChange(fieldName: string) {
  syncXFieldMeta(fieldName)
}

const showStackedOption = computed(() =>
  form.series.some((s: any) => ['bar', 'line', 'area'].includes(s.type))
)

const showSmoothOption = computed(() =>
  form.series.some((s: any) => ['line', 'area'].includes(s.type))
)

async function handleTableChange(tableId: string) {
  form.xField = ''
  syncXFieldMeta('')
  form.series.forEach((s: any) => {
    s.field = ''
  })
  await loadFields(tableId)
}

function addSeries() {
  form.series.push(createDefaultSeries())
}

function removeSeries(index: number) {
  form.series.splice(index, 1)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      const raw = setting.value
      form.tableId = raw.tableId || ''
      form.xField = raw.xField || ''
      form.xFieldMeta = {
        businessType: raw.xFieldMeta?.businessType || '',
        dateFormat: raw.xFieldMeta?.dateFormat || ''
      }

      // Backward compatibility: copy global chartType to each series if series has no type
      const oldChartType = raw.chartType || 'bar'
      form.series = (raw.series || [createDefaultSeries()]).map((s: any) => ({
        field: s.field || '',
        aggregation: s.aggregation || 'sum',
        type: s.type || oldChartType,
        label: s.label || '',
        color: s.color || ''
      }))

      form.appearance = {
        legendPosition: raw.appearance?.legendPosition || 'bottom',
        stacked: raw.appearance?.stacked || false,
        smooth: raw.appearance?.smooth || false,
        orientation: raw.appearance?.orientation || 'vertical',
        showDataLabels: raw.appearance?.showDataLabels || false,
        yAxisFormat: raw.appearance?.yAxisFormat || { precision: 0, prefix: '', suffix: '' },
        referenceLines: raw.appearance?.referenceLines || []
      }

      form.title = raw.title || ''
      form.subtitle = raw.subtitle || ''
      form.footer = raw.footer || ''

      if (form.tableId) {
        await loadFields(form.tableId)
        // Backfill meta for legacy settings that only stored xField name
        if (form.xField && !form.xFieldMeta.businessType) {
          syncXFieldMeta(form.xField)
        }
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    xField: form.xField,
    xFieldMeta: { ...form.xFieldMeta },
    series: form.series.map((s: any) => ({ ...s })),
    appearance: { ...form.appearance },
    title: form.title,
    subtitle: form.subtitle,
    footer: form.footer
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.series-row {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.series-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.series-title {
  font-weight: 600;
  font-size: 14px;
}
.series-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}
.series-field-item {
  margin-bottom: 0;
}
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
