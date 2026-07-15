<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="560px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="View">
        <el-select
          v-model="form.viewId"
          placeholder="Select a table view"
          style="width: 100%"
          :loading="viewsLoading"
          :disabled="!form.tableId"
        >
          <el-option v-for="view in views" :key="view.id" :label="view.name" :value="view.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Title">
        <el-input v-model="form.title" placeholder="e.g. Open Cases" />
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
import { useWidgetTableViews } from '../../composables/dashboard/useWidgetTableViews'

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { tableOptions } = useWidgetTableFields()
const { views, viewsLoading, loadViews } = useWidgetTableViews()

const form = reactive({
  tableId: '',
  viewId: '',
  title: '',
  subtitle: '',
  footer: ''
})

async function handleTableChange(tableId: string) {
  form.viewId = ''
  await loadViews(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.viewId = setting.value.viewId || ''
      form.title = setting.value.title || ''
      form.subtitle = setting.value.subtitle || ''
      form.footer = setting.value.footer || ''
      await loadViews(form.tableId)
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    viewId: form.viewId,
    title: form.title,
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
