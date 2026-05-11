<template>
  <el-dialog v-model="visible" :title="$t('dashboard.setting')" append-to-body width="420px" @close="handleClose">
    <el-form label-position="top">
      <el-form-item label="Table">
        <el-select v-model="form.tableId" placeholder="Select a table" style="width: 100%" @change="handleTableChange">
          <el-option v-for="table in tableOptions" :key="table.item_id" :label="table.name" :value="table.item_id" />
        </el-select>
      </el-form-item>

      <el-form-item label="Chart Type">
        <el-select-v2 v-model="form.chartType" :options="chartTypeOptions" style="width: 100%" />
      </el-form-item>

      <el-form-item label="X-Axis Field (Category)">
        <el-select v-model="form.xField" placeholder="Select field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in fields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Y-Axis Field (Value)">
        <el-select v-model="form.yField" placeholder="Select numeric field" style="width: 100%" :loading="fieldsLoading">
          <el-option v-for="f in numericFields" :key="f.field_name" :label="f.field_name_alias || f.field_name" :value="f.field_name" />
        </el-select>
      </el-form-item>

      <el-form-item label="Y-Axis Aggregation">
        <el-select-v2 v-model="form.aggregation" :options="aggregationOptions" style="width: 100%" />
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
import { useSingleDatabaseContext } from '../../composables/useSignleDatabase'
import { useTableFields } from '../../composables/dashboard/useTableFields'

const emit = defineEmits(['refresh', 'delete'])
const { visible, setting, handleOpen, handleSubmit: baseSubmit, handleDelete, handleClose } = useWidgetSetting(emit)
const { menuState } = useSingleDatabaseContext()
const { getFields, loading: fieldsLoading } = useTableFields()

const tableOptions = computed(() => {
  const items = menuState.value.items || []
  const tables: any[] = []
  function collect(items: any[]) {
    for (const item of items) {
      if (item.item_type === 'master_table' && item.item_id) tables.push(item)
      if (item.children?.length) collect(item.children)
    }
  }
  collect(items)
  return tables
})

const fields = ref<any[]>([])
const numericFields = computed(() =>
  fields.value.filter((f: any) => f.business_type === '2' || f.business_type === 'number')
)

const chartTypeOptions = [
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
  { label: 'Pie', value: 'pie' }
]

const aggregationOptions = [
  { label: 'Count', value: 'count' },
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'avg' }
]

const limitOptions = [
  { label: '10 rows', value: 10 },
  { label: '20 rows', value: 20 },
  { label: '50 rows', value: 50 },
  { label: '100 rows', value: 100 }
]

const form = reactive({
  tableId: '',
  chartType: 'bar',
  xField: '',
  yField: '',
  aggregation: 'count',
  rowLimit: 20
})

async function handleTableChange(tableId: string) {
  form.xField = ''
  form.yField = ''
  if (tableId) {
    fields.value = await getFields(tableId)
  }
}

watch(
  () => visible.value,
  async (isVisible) => {
    if (isVisible) {
      form.tableId = setting.value.tableId || ''
      form.chartType = setting.value.chartType || 'bar'
      form.xField = setting.value.xField || ''
      form.yField = setting.value.yField || ''
      form.aggregation = setting.value.aggregation || 'count'
      form.rowLimit = setting.value.rowLimit || 20
      if (form.tableId) {
        fields.value = await getFields(form.tableId)
      }
    }
  }
)

function handleSubmit() {
  baseSubmit({
    tableId: form.tableId,
    chartType: form.chartType,
    xField: form.xField,
    yField: form.yField,
    aggregation: form.aggregation,
    rowLimit: form.rowLimit
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
