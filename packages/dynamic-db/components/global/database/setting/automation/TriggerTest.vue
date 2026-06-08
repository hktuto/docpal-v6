<script setup lang="ts">
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'
import { watch } from 'vue'

const { masterTableId, tableFields } = defineProps<{
  masterTableId: string
  tableFields: any[]
}>()

const emit = defineEmits<{
  back: []
}>()

const state = reactive({
  loading: false,
  result: []
})

const form = reactive({
  event_type: 'record_created',
  data: {}
})
const testData = ref<any[]>([])

const eventTypeOptions = [
  { label: 'Record Created', value: 'record_created' },
  { label: 'Record Updated', value: 'record_updated' },
  { label: 'Record Deleted', value: 'record_deleted' },
  { label: 'Field Changed', value: 'field_changed' }
]

async function handleRunTest() {
  state.loading = true
  state.result = []
  try {
    const data: any = await newClientApi
      .postDynamicDbTableMastertableidTriggerSettingsTest(masterTableId, {
        event_type: form.event_type,
        data: form.data
      })
      .then((r: any) => r.data)
    if (!data) {
      ElMessage.error('Test Failed')
      return
    }
    const reduce = Object.entries(data).reduce(
      (acc: any, item: any) => {
        if (item[1].passed) acc.passed.push(item[1])
        else acc.failed.push(item[1])
        return acc
      },
      { passed: [], failed: [] }
    )
    state.result = [...reduce.passed, ...reduce.failed]
  } catch (error: any) {
    ElMessage.error(error?.message || 'Test failed')
  } finally {
    state.loading = false
  }
}

function handleBack() {
  emit('back')
}

function initTestData() {
  testData.value = tableFields.map((item: any) => ({
    id: item.field_name,
    name: item.field_name_alias,
    value: ''
  }))
}

watch(
  () => testData,
  () => {
    form.data = testData.value.reduce((acc: any, { id, value }) => {
      acc[id] = value
      return acc
    }, {})
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  initTestData()
})
</script>

<template>
  <el-form label-position="top" size="small">
    <el-form-item label="Event Type" required>
      <el-select v-model="form.event_type" placeholder="Select event type" style="width: 100%">
        <el-option v-for="opt in eventTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </el-form-item>

    <el-divider />
    <template v-for="item in testData" :key="item.id">
      <el-form-item :label="item.name">
        <el-input v-model="item.value" placeholder="Test Value" clearable />
      </el-form-item>
    </template>
  </el-form>

  <div class="test-actions">
    <el-button @click="handleBack">Back</el-button>
    <el-button type="primary" @click="handleRunTest"> Run Test </el-button>
  </div>

  <div v-if="state.result">
    <div>Result</div>
    <template v-for="item in state.result" :key="item.triggerId">
      <div class="test-result">
        <el-descriptions :title="item.trigger_name">
          <el-descriptions-item label="Passed">
            <el-tag size="small" :type="item.passed ? 'success' : 'danger'">
              {{ item.passed ? 'Success' : 'Failure' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.test-header {
  margin-bottom: var(--app-space-m);

  h4 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.test-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
  margin-top: var(--app-space-m);
}

.test-result {
  margin-top: var(--app-space-m);
  padding: var(--app-space-m);
  border: 1px solid var(--app-grey-200);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
}
</style>
