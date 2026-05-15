<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="460px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Columns">
        <el-select v-model="form.columns" multiple collapse-tags placeholder="Select columns" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <!-- Column Order -->
      <el-form-item v-if="orderedColumns.length > 0" label="Column Order">
        <div class="column-order-list">
          <div v-for="(col, index) in orderedColumns" :key="col" class="column-order-item">
            <span class="column-name">{{ fieldLabel(col) }}</span>
            <div class="column-actions">
              <el-button link size="small" :disabled="index === 0" @click="moveColumn(index, -1)">
                <Icon name="lucide:arrow-up" size="14" />
              </el-button>
              <el-button link size="small" :disabled="index === orderedColumns.length - 1" @click="moveColumn(index, 1)">
                <Icon name="lucide:arrow-down" size="14" />
              </el-button>
              <el-button link type="danger" size="small" @click="removeColumn(index)">
                <Icon name="lucide:x" size="14" />
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="Row Limit">
        <el-select-v2 v-model="form.rowLimit" :options="limitOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Sort By">
        <el-select v-model="form.sortField" clearable placeholder="Select field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Sort Order">
        <el-select-v2 v-model="form.sortOrder" :options="sortOptions" style="width: 100%" />
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
  { label: '5 rows', value: 5 },
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 }
]

const sortOptions = [
  { label: 'Ascending', value: 'asc' },
  { label: 'Descending', value: 'desc' }
]

const form = reactive({
  tableId: '',
  columns: [] as string[],
  rowLimit: 10,
  sortField: '',
  sortOrder: 'desc'
})

const orderedColumns = computed(() => form.columns)

function fieldLabel(fieldName: string): string {
  const field = fields.value.find((f: any) => f.field_name === fieldName)
  return field?.field_name_alias || fieldName
}

function moveColumn(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.columns.length) return
  const cols = [...form.columns]
  const temp = cols[index]
  cols[index] = cols[newIndex]
  cols[newIndex] = temp
  form.columns = cols
}

function removeColumn(index: number) {
  form.columns.splice(index, 1)
}

async function handleTableChange(tableId: string) {
  form.columns = []
  form.sortField = ''
  await loadFields(tableId)
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.columns = setting.value.columns || []
      form.rowLimit = setting.value.rowLimit || 10
      form.sortField = setting.value.sortField || ''
      form.sortOrder = setting.value.sortOrder || 'desc'
      if (form.tableId) {
        await loadFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    columns: [...form.columns],
    rowLimit: form.rowLimit,
    sortField: form.sortField,
    sortOrder: form.sortOrder
  })
}

defineExpose({ handleOpen })
</script>

<style scoped lang="scss">
.column-order-list {
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 8px;
}
.column-order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover {
    background: var(--el-fill-color-light);
  }
}
.column-name {
  font-size: 14px;
}
.column-actions {
  display: flex;
  gap: 4px;
}
.footer-grid {
  display: flex;
  justify-content: space-between;
}
</style>
