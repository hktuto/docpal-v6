<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="420px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Fields to Display">
        <el-select v-model="form.fields" multiple collapse-tags placeholder="Select fields" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Row Limit">
        <el-select-v2 v-model="form.limit" :options="limitOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Sort By">
        <el-select v-model="form.sortField" clearable placeholder="Select field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
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

const limitOptions = [
  { label: '3 rows', value: 3 },
  { label: '5 rows', value: 5 },
  { label: '10 rows', value: 10 }
]

const form = reactive({
  tableId: '',
  fields: [] as string[],
  limit: 5,
  sortField: 'createdTime'
})

async function handleTableChange(tableId: string) {
  form.fields = []
  form.sortField = 'createdTime'
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.fields = setting.value.fields || []
      form.limit = setting.value.limit || 5
      form.sortField = setting.value.sortField || 'createdTime'
      if (form.tableId) {
        await loadFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    fields: [...form.fields],
    limit: form.limit,
    sortField: form.sortField
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
