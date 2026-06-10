<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="520px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Group Field">
        <el-select v-model="form.groupField" placeholder="Select a single-select field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in selectFields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Title Field">
        <el-select v-model="form.titleField" clearable placeholder="Select field for card title" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Card Limit">
        <el-select-v2 v-model="form.limit" :options="limitOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Label">
        <el-input v-model="form.label" placeholder="e.g. Project Board" />
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

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions, fields, fieldsLoading, loadFields } = useWidgetTableFields()

const limitOptions = [
  { label: '50 cards', value: 50 },
  { label: '100 cards', value: 100 },
  { label: '200 cards', value: 200 }
]

const selectFields = computed(() =>
  fields.value.filter((f: any) => {
    const bt = String(f.business_type || '')
    return bt === ColumnFieldType.SingleSelect || bt === '3'
  })
)

const form = reactive({
  tableId: '',
  groupField: '',
  titleField: '',
  limit: 100,
  label: '',
  subtitle: '',
  footer: ''
})

async function handleTableChange(tableId: string) {
  form.groupField = ''
  form.titleField = ''
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.groupField = setting.value.groupField || ''
      form.titleField = setting.value.titleField || ''
      form.limit = setting.value.limit || 100
      form.label = setting.value.label || ''
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
    groupField: form.groupField,
    titleField: form.titleField,
    limit: form.limit,
    label: form.label,
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
