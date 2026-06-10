<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="420px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

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

      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. Completion Rate" />
      </el-form-item>

      <el-form-item label="Color">
        <el-select-v2 v-model="form.color" :options="colorOptions" style="width: 100%" />
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

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields } = useWidgetTableFields()

const colorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Success', value: 'success' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' }
]

const form = reactive({
  tableId: '',
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

async function handleTableChange(tableId: string) {
  form.filterField = ''
  form.filterValue = ''
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
  baseSubmit({
    tableId: form.tableId,
    filterField: form.filterField,
    filterValue: form.filterValue,
    label: form.label,
    color: form.color,
    subtitle: form.subtitle,
    footer: form.footer
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
