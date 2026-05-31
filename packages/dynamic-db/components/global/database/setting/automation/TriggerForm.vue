<script setup lang="ts">
import { clientApi, newClientApi } from 'api'
import type { TriggerSettingDTO, TableFieldDTO } from 'api'
import { ElMessage } from 'element-plus'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { workflowResponseHelper } from '../../../../../../workflow/utils/jsonConversion'

const routerProvider = inject(MenuRouterKey)
const { masterTableId, tableFields, trigger } = defineProps<{
  masterTableId: string
  tableFields: any[]
  trigger?: TriggerSettingDTO
}>()
const emit = defineEmits<{
  saved: []
  cancel: []
}>()
const isEdit = computed(() => !!trigger?.id)
const state = reactive({
  loading: false,
  saving: false,
  fields: [] as TableFieldDTO[]
})
const form = ref({
  trigger_name: '',
  description: '',
  event_type: 'record_created',
  watch_field: '',
  match_type: 'all',
  workflow_id: '',
  status: 'A',
  conditions: {
    trigger_rule: [] as Array<{
      id: string
      field_name: string
      operator: string
      value: string
    }>
  },
  map_workflow_parameters: {}
})
const eventTypeOptions = [
  { label: 'Record is created', value: 'record_created', desc: 'When a new record is added to this table.' },
  { label: 'Record is updated', value: 'record_updated', desc: 'When any field of an existing record is modified.' },
  { label: 'Record is deleted', value: 'record_deleted', desc: 'When a record is removed from this table.' },
  { label: 'Field is changed', value: 'field_changed', desc: 'When a specific field value changes.' }
]
const workflowErrorMessage = ref<string>('')
const workflowFormFields = ref<any[]>([])

function isBooleanField(fieldName: string): boolean {
  const find = tableFields.find((f: any) => f.field_name === fieldName)
  if (!find) return false
  const bt = find.business_type
  return bt === ColumnFieldType.Checkbox
}

function isNumericField(fieldName: string): boolean {
  const field = tableFields.find((f: any) => f.field_name === fieldName)
  if (!field) return false
  const bt = field.business_type
  return bt === ColumnFieldType.Number || bt === ColumnFieldType.Rating
}

function isDateField(fieldName: string): boolean {
  const field = tableFields.find((f: any) => f.field_name === fieldName)
  if (!field) return false
  const bt = field.business_type
  return bt === ColumnFieldType.DateTime || bt === ColumnFieldType.CreatedTime || bt === ColumnFieldType.LastModifiedTime
}

function getOperatorsForField(fieldName: string): Array<{ label: string; value: string }> {
  if (!fieldName) return []
  if (isBooleanField(fieldName)) {
    return [{ label: 'Equals', value: 'eq' }]
  }
  if (isDateField(fieldName)) {
    return [
      { label: 'Equals', value: 'eq' },
      { label: 'After', value: 'gt' },
      { label: 'After or equals', value: 'gte' },
      { label: 'Before', value: 'lt' },
      { label: 'Before or equals', value: 'lte' },
      { label: 'Is empty', value: 'is_empty' },
      { label: 'Is not empty', value: 'is_not_empty' }
    ]
  }
  if (isNumericField(fieldName)) {
    return [
      { label: '=', value: 'eq' },
      // { label: '≠', value: 'ne' },
      { label: '>', value: 'gt' },
      { label: '≥', value: 'gte' },
      { label: '<', value: 'lt' },
      { label: '≤', value: 'lte' },
      { label: 'Is empty', value: 'is_empty' },
      { label: 'Is not empty', value: 'is_not_empty' }
    ]
  }
  return [
    { label: 'Contains', value: 'contains' },
    { label: 'Equals', value: 'eq' },
    // { label: 'Not equals', value: 'ne' },
    { label: 'Is empty', value: 'is_empty' },
    { label: 'Is not empty', value: 'is_not_empty' }
  ]
}

function isValueEmptyOperator(operator: string): boolean {
  return ['is_empty', 'is_not_empty'].includes(operator)
}

const fieldOptions = computed(() => {
  return tableFields.map((f: any) => ({
    label: f.field_name_alias || f.field_name,
    value: f.field_name
  }))
})

const showWatchField = computed(() => form.value.event_type === 'field_changed')
const currentEvent = computed(() => eventTypeOptions.find((o) => o.value === form.value.event_type))

function generateId() {
  return `${Date.now()}`
}

function handleFieldChange(condition: any) {
  if (!condition.field_name) return
  const ops = getOperatorsForField(condition.field_name)
  condition.operator = ops.length > 0 ? ops[0].value : 'eq'
  condition.value = ''
}

function handleAddCondition() {
  form.value.conditions.trigger_rule.push({
    id: generateId(),
    field_name: '',
    operator: 'eq',
    value: ''
  })
}

function handleRemoveCondition(index: number) {
  form.value.conditions.trigger_rule.splice(index, 1)
}

function resetForm() {
  form.value = {
    trigger_name: '',
    description: '',
    event_type: 'record_created',
    watch_field: '',
    match_type: 'all',
    workflow_id: '',
    status: 'A',
    conditions: {
      trigger_rule: []
    },
    map_workflow_parameters: {}
  }
}

async function init() {
  await hydrateForm()

  if (!!form.value.workflow_id && form.value.workflow_id !== '') {
    await handleChangeWorkflow()
  }
  workflowFormFields.value = workflowFormFields.value.map((item: any) => {
    const v = trigger.map_workflow_parameters[item.id]
    return v === undefined ? item : { ...item, value: v }
  })
}

async function hydrateForm() {
  if (!trigger) {
    resetForm()
    return
  }
  form.value = deepCopy(trigger)
}

async function handleSave() {
  workflowErrorMessage.value = ''
  if (!form.value.trigger_name.trim()) {
    ElMessage.warning('Trigger name is required')
    return
  }
  if (showWatchField.value && !form.value.watch_field) {
    ElMessage.warning('Watch field is required for Field Changed event')
    return
  }

  console.log(2222,form.value)
  return
  const payload = {
    trigger_name: form.value.trigger_name,
    description: form.value.description,
    event_type: form.value.event_type,
    watch_field: showWatchField.value ? form.value.watch_field : undefined,
    conditions: form.value.conditions,
    match_type: form.value.match_type,
    workflow_id: form.value.workflow_id,
    map_workflow_parameters: form.value.map_workflow_parameters,
    status: form.value.status
  }

  state.saving = true
  try {
    if (isEdit.value && trigger?.id) {
      const data = await newClientApi.patchDynamicDbTableMastertableidTriggerSettingsId(masterTableId, trigger.id, payload).then((r: any) => r.data)
      if (data?.result !== false) {
        ElMessage.success('Trigger updated')
        emit('saved')
      } else {
        ElMessage.error(data?.message || 'Update failed')
      }
    } else {
      const data = await newClientApi.postDynamicDbTableMastertableidTriggerSettings(masterTableId, payload).then((r: any) => r.data)
      if (data?.result !== false) {
        ElMessage.success('Trigger created')
        emit('saved')
      } else {
        ElMessage.error(data?.message || 'Create failed')
      }
    }
  } catch (error: any) {
    ElMessage.error(error?.message || 'Save failed')
  } finally {
    state.saving = false
  }
}

function handleCancel() {
  emit('cancel')
}

async function handleChangeWorkflow() {
  try {
    const data = await clientApi.instance.get(`/oniflow/api/v1/workflow/definitions/instance/${form.value.workflow_id}`).then((r: any) => workflowResponseHelper(r))
    if (!data) {
      routerProvider?.message?.error('Failed to get workflow details')
      return
    }
    if (!data.content) {
      routerProvider?.message?.error('Workflow is not activated')
      return
    }

    const startEventNode = data.content?.nodes?.find((item: any) => item.type == 'StartEvent')
    workflowFormFields.value = startEventNode.config?.initialise?.form_fields.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      display_type: field.display_type,
      value: ''
    }))
  } catch (e) {
    console.log(e)
  }
}

onMounted(async () => {
  await init()
})
</script>

<template>
  <div v-loading="state.loading" class="trigger-editor">
    <!-- When preview card -->
    <div class="section-title">When</div>
    <div class="preview-card">
      <div class="preview-badge">
        <Icon name="lucide:zap" size="16" />
        <span>Trigger</span>
      </div>
      <div class="preview-name">{{ isEdit ? '1.' : 'New' }} {{ currentEvent?.label || 'Trigger' }}</div>
      <div class="preview-desc">
        {{ currentEvent?.desc }}
      </div>
    </div>

    <!-- Config form -->
    <div class="config-panel">
      <div class="field-group">
        <label class="field-label">Trigger name <span class="required">*</span></label>
        <el-input v-model="form.trigger_name" placeholder="Enter trigger name" size="small" />
      </div>

      <div class="field-group">
        <label class="field-label">Event type <span class="required">*</span></label>
        <el-select v-model="form.event_type" placeholder="Select event type" size="small" style="width: 100%">
          <el-option v-for="opt in eventTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <div class="field-hint">{{ currentEvent?.desc }}</div>
      </div>

      <div v-if="showWatchField" class="field-group">
        <label class="field-label">Watch field <span class="required">*</span></label>
        <el-select v-model="form.watch_field" placeholder="Select field" size="small" style="width: 100%">
          <el-option v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </div>

      <div class="field-group">
        <label class="field-label">Match conditions</label>
        <div class="match-type-row">
          <el-radio-group v-model="form.match_type" size="small">
            <el-radio-button label="all">All conditions</el-radio-button>
            <el-radio-button label="any">Any condition</el-radio-button>
          </el-radio-group>
        </div>

        <div class="conditions-stack">
          <div v-for="(condition, index) in form.conditions.trigger_rule" :key="condition.id" class="condition-line">
            <div class="connector-label">
              <span v-if="index === 0">When</span>
              <span v-else>{{ form.match_type === 'all' ? 'And' : 'Or' }}</span>
            </div>
            <el-select v-model="condition.field_name" placeholder="Field" size="small" style="flex: 1.2"
                       @change="handleFieldChange(condition)">
              <el-option v-for="opt in fieldOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
            <el-select v-model="condition.operator" placeholder="Operator" size="small" style="flex: 1">
              <el-option v-for="opt in getOperatorsForField(condition.field_name)" :key="opt.value" :label="opt.label"
                         :value="opt.value" />
            </el-select>
            <el-date-picker
              v-if="isDateField(condition.field_name)"
              v-model="condition.value"
              placeholder="Select date"
              size="small"
              style="flex: 1.2"
              value-format="x"
            />
            <div v-else-if="isValueEmptyOperator(condition.operator)" class="placeholder-input" style="flex: 1.2" />
            <el-input v-else v-model="condition.value" placeholder="Value" size="small" style="flex: 1.2" />
            <button class="icon-btn" @click="handleRemoveCondition(index)">
              <Icon name="lucide:x" size="14" />
            </button>
          </div>

          <button class="ghost-btn" @click="handleAddCondition">
            <Icon name="lucide:plus" size="14" />
            New match condition
          </button>
        </div>
      </div>
    </div>

    <!-- Then section -->
    <div class="section-title">Then</div>
    <div class="then-badge">
      <Icon name="lucide:arrow-right" size="14" />
      <span>Action</span>
    </div>
    <div class="then-card">
      <DatabaseSettingAutomationTriggerFormWorkflow :formData="form" :tableFields="tableFields" />

    </div>

    <!-- Footer -->
    <div class="editor-footer">
      <div class="status-toggle">
        <el-radio-group v-model="form.status" size="small">
          <el-radio-button label="A">Active</el-radio-button>
          <el-radio-button label="I">Inactive</el-radio-button>
        </el-radio-group>
      </div>
      <div class="actions">
        <el-button size="small" @click="handleCancel">Cancel</el-button>
        <el-button size="small" type="primary" :loading="state.saving" @click="handleSave">Save</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.trigger-editor {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.add-filed-group {
  display: flex;
}

.section-title {
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--app-grey-900);
}

.preview-card {
  padding: var(--app-space-m);
  background: var(--app-paper);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);

  .preview-badge {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-8500);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .preview-name {
    font-size: var(--app-font-size-m);
    font-weight: 500;
    color: var(--app-grey-900);
  }

  .preview-desc {
    font-size: var(--app-font-size-s);
    color: var(--app-grey-8500);
    line-height: 1.4;
  }
}

.config-panel {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);

  .field-label {
    font-size: var(--app-font-size-s);
    font-weight: 500;
    color: var(--app-grey-700);

    .required {
      color: var(--el-color-danger);
    }
  }

  .field-hint {
    font-size: var(--app-font-size-s);
    color: var(--app-grey-8500);
    line-height: 1.4;
  }
}

.match-type-row {
  display: flex;
  align-items: center;
}

.conditions-stack {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.condition-line {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  background: var(--app-grey-850);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius);

  .connector-label {
    width: 3rem;
    flex-shrink: 0;
    font-size: var(--app-font-size-s);
    font-weight: 500;
    color: var(--app-grey-8500);
    text-align: center;
  }

  .placeholder-input {
    min-height: 2.4rem;
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--app-grey-400);
  cursor: pointer;
  border-radius: var(--app-border-radius);
  transition: all 0.2s;

  &:hover {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
}

.ghost-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-xs);
  width: 100%;
  padding: var(--app-space-s);
  background: transparent;
  border: 1px dashed var(--app-grey-300);
  border-radius: var(--app-border-radius);
  color: var(--app-grey-600);
  font-size: var(--app-font-size-s);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.then-card {
  padding: var(--app-space-m);
  background: var(--app-grey-850);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);

  .then-badge {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-8500);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-grey-800);

  .actions {
    display: flex;
    gap: var(--app-space-s);
  }
}
</style>
