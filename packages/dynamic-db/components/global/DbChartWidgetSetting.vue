<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="520px" @close="handleClose">
    <el-form label-position="top">
      <!-- Table -->
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <!-- Chart Type -->
      <el-form-item label="Chart Type">
        <el-select-v2 v-model="form.chartType" :options="chartTypeOptions" style="width: 100%" />
      </el-form-item>

      <!-- X-Axis -->
      <el-form-item label="X-Axis Field (Category)">
        <el-select v-model="form.xField" placeholder="Select field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <!-- Time Granularity -->
      <el-form-item v-if="isDateField(form.xField)" label="Time Granularity">
        <el-select-v2 v-model="form.xTimeGranularity" :options="timeGranularityOptions" style="width: 100%" />
      </el-form-item>

      <!-- Series -->
      <el-divider>Series</el-divider>
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
              :placeholder="series.aggregation === 'count' ? 'Optional — leave empty to count all' : 'Select numeric field'"
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
        <el-form-item v-if="showStackedOption" label="Stacked">
          <el-switch v-model="form.appearance.stacked" />
        </el-form-item>
        <el-form-item v-if="showSmoothOption" label="Smooth Lines">
          <el-switch v-model="form.appearance.smooth" />
        </el-form-item>
      </div>

      <!-- Row Limit -->
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

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields, numericFields, isDateField } = useWidgetTableFields()

const chartTypeOptions = [
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
  { label: 'Area', value: 'area' }
]

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' }
]

const timeGranularityOptions = [
  { label: 'None', value: '' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' }
]

const legendPositionOptions = [
  { label: 'None', value: 'none' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' }
]

const limitOptions = [
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 },
  { label: '200 rows', value: 200 }
]

function createDefaultSeries(): any {
  return {
    field: '',
    aggregation: 'sum',
    label: '',
    color: ''
  }
}

const form = reactive({
  tableId: '',
  chartType: 'bar',
  xField: '',
  xTimeGranularity: '',
  series: [createDefaultSeries()] as any[],
  appearance: {
    legendPosition: 'bottom',
    stacked: false,
    smooth: false
  },
  rowLimit: 20
})

const showStackedOption = computed(() =>
  ['bar', 'line', 'area'].includes(form.chartType)
)

const showSmoothOption = computed(() =>
  ['line', 'area'].includes(form.chartType)
)

async function handleTableChange(tableId: string) {
  form.xField = ''
  form.xTimeGranularity = ''
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
      form.chartType = raw.chartType || 'bar'
      form.xField = raw.xField || ''
      form.xTimeGranularity = raw.xTimeGranularity || ''
      form.series = (raw.series || [createDefaultSeries()]).map((s: any) => ({
        field: s.field || '',
        aggregation: s.aggregation || 'sum',
        label: s.label || '',
        color: s.color || ''
      }))
      form.appearance = {
        legendPosition: raw.appearance?.legendPosition || 'bottom',
        stacked: raw.appearance?.stacked || false,
        smooth: raw.appearance?.smooth || false
      }
      form.rowLimit = raw.rowLimit || 20
      if (form.tableId) {
        await loadFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    chartType: form.chartType,
    xField: form.xField,
    xTimeGranularity: form.xTimeGranularity,
    series: form.series.map((s: any) => ({ ...s })),
    appearance: { ...form.appearance },
    rowLimit: form.rowLimit
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
