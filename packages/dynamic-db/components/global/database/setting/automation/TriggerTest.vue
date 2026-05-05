<script setup lang="ts">
import { clientApi } from 'api'
import type { TriggerSettingDTO } from 'api'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  masterTableId: string
  trigger: TriggerSettingDTO
}>()

const emit = defineEmits<{
  back: []
}>()

const state = reactive({
  loading: false,
  result: null as Record<string, any> | null
})

const form = reactive({
  event_type: props.trigger.event_type || 'record_created',
  data: '{}'
})

const eventTypeOptions = [
  { label: 'Record Created', value: 'record_created' },
  { label: 'Record Updated', value: 'record_updated' },
  { label: 'Record Deleted', value: 'record_deleted' },
  { label: 'Field Changed', value: 'field_changed' }
]

async function handleRunTest() {
  let parsedData: Record<string, any>
  try {
    parsedData = JSON.parse(form.data)
  } catch {
    ElMessage.error('Invalid JSON in test data')
    return
  }

  state.loading = true
  state.result = null
  try {
    const { data } = await clientApi.api.postDynamicDbTableMastertableidTriggerSettingsTest(props.masterTableId, {
      event_type: form.event_type,
      data: parsedData
    })
    state.result = data?.data || {}
    ElMessage.success('Test completed')
  } catch (error: any) {
    ElMessage.error(error?.message || 'Test failed')
  } finally {
    state.loading = false
  }
}

function handleBack() {
  emit('back')
}

onMounted(() => {
  // Pre-fill sample data if trigger has conditions referencing fields
  const sample: Record<string, any> = {}
  const rules = props.trigger.conditions?.trigger_rule || []
  if (Array.isArray(rules)) {
    rules.forEach((rule: any) => {
      if (rule.field_name) {
        sample[rule.field_name] = ''
      }
    })
  }
  if (Object.keys(sample).length > 0) {
    form.data = JSON.stringify(sample, null, 2)
  }
})
</script>

<template>
  <div v-loading="state.loading">
    <div class="test-header">
      <h4>Test Trigger: {{ trigger.trigger_name }}</h4>
    </div>

    <el-form label-position="top" size="small">
      <el-form-item label="Event Type" required>
        <el-select v-model="form.event_type" placeholder="Select event type" style="width: 100%">
          <el-option
            v-for="opt in eventTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Test Data (JSON)" required>
        <el-input
          v-model="form.data"
          type="textarea"
          :rows="6"
          placeholder='{"field_name": "value"}'
        />
      </el-form-item>
    </el-form>

    <div class="test-actions">
      <el-button @click="handleBack">Back</el-button>
      <el-button type="primary" @click="handleRunTest">
        Run Test
      </el-button>
    </div>

    <div v-if="state.result" class="test-result">
      <div class="result-label">Result</div>
      <pre>{{ JSON.stringify(state.result, null, 2) }}</pre>
    </div>
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
  background: var(--app-grey-50);
  border: 1px solid var(--app-grey-200);
  border-radius: var(--app-border-radius);

  .result-label {
    font-weight: 600;
    margin-bottom: var(--app-space-s);
    font-size: var(--app-font-size-s);
  }

  pre {
    margin: 0;
    font-size: var(--app-font-size-s);
    overflow-x: auto;
  }
}
</style>
