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

      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. CPU Usage" />
      </el-form-item>

      <el-divider>Annotation</el-divider>

      <el-form-item label="Subtitle">
        <el-input v-model="form.subtitle" placeholder="e.g. Q1 2024 overview" />
      </el-form-item>

      <el-form-item label="Footer">
        <el-input v-model="form.footer" placeholder="e.g. Data refreshed daily" />
      </el-form-item>

      <el-form-item label="Min">
        <el-input-number v-model="form.min" :controls="false" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Max">
        <el-input-number v-model="form.max" :controls="false" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Target">
        <el-input-number v-model="form.target" :controls="false" style="width: 100%" />
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
const { tableOptions, numericFields, fieldsLoading, loadFields } = useWidgetTableFields()

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' },
  { label: 'Minimum', value: 'min' },
  { label: 'Maximum', value: 'max' }
]

const form = reactive({
  tableId: '',
  aggregation: 'sum',
  field: '',
  label: 'Metric',
  subtitle: '',
  footer: '',
  min: 0,
  max: 100,
  target: 80
})

async function handleTableChange(tableId: string) {
  form.field = ''
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.aggregation = setting.value.aggregation || 'sum'
      form.field = setting.value.field || ''
      form.label = setting.value.label || 'Metric'
      form.subtitle = setting.value.subtitle || ''
      form.footer = setting.value.footer || ''
      form.min = setting.value.min ?? 0
      form.max = setting.value.max ?? 100
      form.target = setting.value.target ?? 80
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
    label: form.label,
    subtitle: form.subtitle,
    footer: form.footer,
    min: form.min,
    max: form.max,
    target: form.target
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.footer-grid {
  display: flex;
  justify-content: space-between;
}
</style>
