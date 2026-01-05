<script lang="ts" setup>
import type { Database, Table, Column, FilterCondition } from '../../../types/database'
import { useDatabase } from '../../../composables/useDatabase'
import { ElMessage, ElMessageBox } from 'element-plus'
import FilterBuilder from '../FilterBuilder.vue'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { updateTable } = useDatabase()

// Trigger Event Types
type TriggerEvent = 'record.created' | 'record.updated' | 'record.deleted' | 'field.changed'

// Trigger Action Types
interface TriggerAction {
  type: 'send_to_workflow'
  config: {
    workflowId: string
    workflowName: string
    includeFullData: boolean
    includeRelated: boolean
  }
}

// Trigger Definition
interface Trigger {
  id: string
  name: string
  description?: string // User-provided or auto-generated description
  enabled: boolean
  event: TriggerEvent
  watchField?: string // For field.changed event
  conditions: FilterCondition[]
  conditionLogic: 'AND' | 'OR'
  actions: TriggerAction[]
  createdAt: string
  createdBy: string
  lastTriggered?: string
  executionCount: number
}

// State
const triggers = ref<Trigger[]>([
  // Trigger 1: New records with pending status
  {
    id: 'trigger-1',
    name: 'Send to Review Workflow',
    description: 'Automatically route new pending tasks to the review team',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'status', operator: 'equals', value: 'pending' }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-1',
        workflowName: 'Review Process',
        includeFullData: true,
        includeRelated: false
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
    executionCount: 12
  },
  
  // Trigger 2: High priority items
  {
    id: 'trigger-2',
    name: 'Urgent Item Alert',
    description: 'Notify managers when high-priority items are created',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'priority', operator: 'equals', value: 'high' }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-2',
        workflowName: 'Manager Notification',
        includeFullData: true,
        includeRelated: true
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
    executionCount: 8
  },

  // Trigger 3: Status changed to completed
  {
    id: 'trigger-3',
    name: 'Task Completion Handler',
    description: 'Archive completed tasks and notify stakeholders',
    enabled: true,
    event: 'record.updated',
    watchField: 'status',
    conditions: [
      { field: 'status', operator: 'equals', value: 'completed' }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-3',
        workflowName: 'Archive & Notify',
        includeFullData: true,
        includeRelated: false
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-2',
    executionCount: 24,
    lastTriggered: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
  },

  // Trigger 4: High value items requiring approval
  {
    id: 'trigger-4',
    name: 'High Value Approval',
    description: 'Require approval for items over $10,000',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'amount', operator: 'gt', value: 10000 }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-4',
        workflowName: 'Finance Approval',
        includeFullData: true,
        includeRelated: true
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    executionCount: 5
  },

  // Trigger 5: Overdue items
  {
    id: 'trigger-5',
    name: 'Overdue Task Escalation',
    description: 'Escalate tasks that are past due date and not completed',
    enabled: true,
    event: 'record.updated',
    watchField: 'dueDate',
    conditions: [
      { field: 'status', operator: 'equals', value: 'in-progress' },
      { field: 'dueDate', operator: 'lt', value: new Date().toISOString().split('T')[0] }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-5',
        workflowName: 'Escalation Process',
        includeFullData: true,
        includeRelated: true
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-2',
    executionCount: 15,
    lastTriggered: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
  },

  // Trigger 6: Quality assurance check
  {
    id: 'trigger-6',
    name: 'QA Check Required',
    description: 'Send to QA when priority is high or critical',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'priority', operator: 'in', value: ['high', 'critical'] },
      { field: 'type', operator: 'equals', value: 'development' }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-6',
        workflowName: 'QA Process',
        includeFullData: true,
        includeRelated: false
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    executionCount: 18
  },

  // Trigger 7: Disabled example
  {
    id: 'trigger-7',
    name: 'Budget Alert (Disabled)',
    description: 'Alert when budget exceeds threshold - currently disabled for testing',
    enabled: false,
    event: 'record.updated',
    watchField: 'budget',
    conditions: [
      { field: 'budget', operator: 'gt', value: 50000 }
    ],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-7',
        workflowName: 'Budget Review',
        includeFullData: true,
        includeRelated: true
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
    executionCount: 0
  },

  // Trigger 8: Multiple conditions with OR logic
  {
    id: 'trigger-8',
    name: 'Multiple Department Handler',
    description: 'Route to shared workflow if from Sales, Marketing, or Support',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'department', operator: 'equals', value: 'sales' },
      { field: 'department', operator: 'equals', value: 'marketing' },
      { field: 'department', operator: 'equals', value: 'support' }
    ],
    conditionLogic: 'OR',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-8',
        workflowName: 'Customer Success Flow',
        includeFullData: true,
        includeRelated: false
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-2',
    executionCount: 32,
    lastTriggered: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
  },

  // Trigger 9: Record deletion audit
  {
    id: 'trigger-9',
    name: 'Deletion Audit Log',
    description: 'Log all record deletions for compliance',
    enabled: true,
    event: 'record.deleted',
    conditions: [],
    conditionLogic: 'AND',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-9',
        workflowName: 'Audit Logger',
        includeFullData: true,
        includeRelated: true
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-3',
    executionCount: 7,
    lastTriggered: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },

  // Trigger 10: Empty field check
  {
    id: 'trigger-10',
    name: 'Missing Information Alert',
    description: 'Alert when important fields are empty on creation',
    enabled: true,
    event: 'record.created',
    conditions: [
      { field: 'assignee', operator: 'isEmpty', value: undefined },
      { field: 'dueDate', operator: 'isEmpty', value: undefined }
    ],
    conditionLogic: 'OR',
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: 'workflow-10',
        workflowName: 'Data Validation Alert',
        includeFullData: true,
        includeRelated: false
      }
    }],
    createdAt: new Date().toISOString(),
    createdBy: 'user-1',
    executionCount: 11
  }
])

const showTriggerDialog = ref(false)
const showTestDialog = ref(false)
const editingTrigger = ref<Trigger | null>(null)
const activeTab = ref<'list' | 'decision-table' | 'graph'>('list')

// Form state
const triggerForm = ref({
  name: '',
  description: '',
  event: 'record.created' as TriggerEvent,
  watchField: '',
  conditions: [] as FilterCondition[],
  conditionLogic: 'AND' as 'AND' | 'OR',
  workflowId: '',
  workflowName: '',
  includeFullData: true,
  includeRelated: false
})

// Test state
const testEvent = ref<TriggerEvent>('record.created')
const testData = ref<Record<string, any>>({})
const testResults = ref<{
  triggerId: string
  triggerName: string
  matched: boolean
  workflow?: string
  description?: string
}[]>([])

// Event options
const eventOptions = [
  { value: 'record.created', label: 'Record Created', icon: 'Plus', description: 'Trigger when a new record is created' },
  { value: 'record.updated', label: 'Record Updated', icon: 'Edit', description: 'Trigger when a record is updated' },
  { value: 'record.deleted', label: 'Record Deleted', icon: 'Delete', description: 'Trigger when a record is deleted' },
  { value: 'field.changed', label: 'Field Changed', icon: 'Switch', description: 'Trigger when a specific field changes' }
]

// Mock workflows for demo
const availableWorkflows = [
  { id: 'workflow-1', name: 'Review Process' },
  { id: 'workflow-2', name: 'Manager Notification' },
  { id: 'workflow-3', name: 'Archive & Notify' },
  { id: 'workflow-4', name: 'Finance Approval' },
  { id: 'workflow-5', name: 'Escalation Process' },
  { id: 'workflow-6', name: 'QA Process' },
  { id: 'workflow-7', name: 'Budget Review' },
  { id: 'workflow-8', name: 'Customer Success Flow' },
  { id: 'workflow-9', name: 'Audit Logger' },
  { id: 'workflow-10', name: 'Data Validation Alert' },
  { id: 'workflow-11', name: 'Email Campaign' },
  { id: 'workflow-12', name: 'Slack Integration' },
  { id: 'workflow-13', name: 'Document Generation' },
  { id: 'workflow-14', name: 'API Webhook' }
]

// Computed
const watchableFields = computed(() => {
  return props.table.columns.filter(c => 
    !['fx', 'rollup'].includes(c.type)
  )
})

// Functions
function handleAddTrigger() {
  editingTrigger.value = null
  triggerForm.value = {
    name: '',
    description: '',
    event: 'record.created',
    watchField: '',
    conditions: [],
    conditionLogic: 'AND',
    workflowId: '',
    workflowName: '',
    includeFullData: true,
    includeRelated: false
  }
  showTriggerDialog.value = true
}

function handleEditTrigger(trigger: Trigger) {
  editingTrigger.value = trigger
  triggerForm.value = {
    name: trigger.name,
    description: trigger.description || '',
    event: trigger.event,
    watchField: trigger.watchField || '',
    conditions: [...trigger.conditions],
    conditionLogic: trigger.conditionLogic,
    workflowId: trigger.actions[0]?.config.workflowId || '',
    workflowName: trigger.actions[0]?.config.workflowName || '',
    includeFullData: trigger.actions[0]?.config.includeFullData ?? true,
    includeRelated: trigger.actions[0]?.config.includeRelated ?? false
  }
  showTriggerDialog.value = true
}

function generateDescription(form: typeof triggerForm.value): string {
  const eventLabel = getEventLabel(form.event)
  const workflow = availableWorkflows.find(w => w.id === form.workflowId)
  
  let description = `When ${eventLabel.toLowerCase()}`
  
  if (form.event === 'field.changed' && form.watchField) {
    const field = props.table.columns.find(c => c.field === form.watchField)
    description += ` (${field?.title || form.watchField})`
  }
  
  if (form.conditions.length > 0) {
    const conditionsText = form.conditions.length === 1 
      ? '1 condition matches'
      : `${form.conditions.length} conditions match (${form.conditionLogic})`
    description += `, if ${conditionsText}`
  }
  
  description += `, send to "${workflow?.name || 'workflow'}"`
  
  return description
}

function handleSaveTrigger() {
  if (!triggerForm.value.name || !triggerForm.value.workflowId) {
    ElMessage.warning('Please fill in trigger name and select a workflow')
    return
  }

  const workflow = availableWorkflows.find(w => w.id === triggerForm.value.workflowId)
  
  // Use provided description or auto-generate
  const description = triggerForm.value.description.trim() || generateDescription(triggerForm.value)
  
  const trigger: Trigger = {
    id: editingTrigger.value?.id || `trigger-${Date.now()}`,
    name: triggerForm.value.name,
    description,
    enabled: true,
    event: triggerForm.value.event,
    watchField: triggerForm.value.event === 'field.changed' ? triggerForm.value.watchField : undefined,
    conditions: triggerForm.value.conditions,
    conditionLogic: triggerForm.value.conditionLogic,
    actions: [{
      type: 'send_to_workflow',
      config: {
        workflowId: triggerForm.value.workflowId,
        workflowName: workflow?.name || '',
        includeFullData: triggerForm.value.includeFullData,
        includeRelated: triggerForm.value.includeRelated
      }
    }],
    createdAt: editingTrigger.value?.createdAt || new Date().toISOString(),
    createdBy: 'user-1',
    lastTriggered: editingTrigger.value?.lastTriggered,
    executionCount: editingTrigger.value?.executionCount || 0
  }

  if (editingTrigger.value) {
    const index = triggers.value.findIndex(t => t.id === editingTrigger.value!.id)
    if (index !== -1) {
      triggers.value[index] = trigger
    }
  } else {
    triggers.value.push(trigger)
  }

  showTriggerDialog.value = false
  ElMessage.success('Trigger saved successfully')
  emit('updated')
}

function handleToggleTrigger(trigger: Trigger) {
  trigger.enabled = !trigger.enabled
  ElMessage.success(`Trigger ${trigger.enabled ? 'enabled' : 'disabled'}`)
  emit('updated')
}

function handleDeleteTrigger(trigger: Trigger) {
  ElMessageBox.confirm(
    `Are you sure you want to delete "${trigger.name}"?`,
    'Delete Trigger',
    {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    }
  ).then(() => {
    triggers.value = triggers.value.filter(t => t.id !== trigger.id)
    ElMessage.success('Trigger deleted')
    emit('updated')
  }).catch(() => {})
}

function handleTestAllTriggers() {
  // Initialize test data with default values
  testData.value = {}
  props.table.columns.forEach(col => {
    if (col.type === 'text') testData.value[col.field] = 'Sample Text'
    else if (col.type === 'number') testData.value[col.field] = 42
    else if (col.type === 'checkbox') testData.value[col.field] = false
    else if (col.type === 'date') testData.value[col.field] = new Date().toISOString().split('T')[0]
  })
  testEvent.value = 'record.created'
  testResults.value = []
  showTestDialog.value = true
}

function runTest() {
  testResults.value = []
  
  // Test all triggers that match the selected event
  const matchingTriggers = triggers.value.filter(t => 
    t.enabled && t.event === testEvent.value
  )

  matchingTriggers.forEach(trigger => {
    // Check if conditions match
    const matched = evaluateConditions(trigger.conditions, testData.value, trigger.conditionLogic)

    testResults.value.push({
      triggerId: trigger.id,
      triggerName: trigger.name,
      description: trigger.description,
      matched,
      workflow: matched ? trigger.actions[0]?.config.workflowName : undefined
    })
  })

  // Also show disabled triggers that would match
  const disabledTriggers = triggers.value.filter(t => 
    !t.enabled && t.event === testEvent.value
  )
  
  disabledTriggers.forEach(trigger => {
    const matched = evaluateConditions(trigger.conditions, testData.value, trigger.conditionLogic)
    if (matched) {
      testResults.value.push({
        triggerId: trigger.id,
        triggerName: trigger.name + ' (Disabled)',
        description: trigger.description,
        matched: false,
        workflow: trigger.actions[0]?.config.workflowName
      })
    }
  })
}

function evaluateConditions(conditions: FilterCondition[], data: Record<string, any>, logic: 'AND' | 'OR'): boolean {
  if (conditions.length === 0) return true

  const results = conditions.map(condition => {
    const fieldValue = data[condition.field]
    const conditionValue = condition.value

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue
      case 'contains':
        return String(fieldValue).includes(String(conditionValue))
      case 'gt':
        return Number(fieldValue) > Number(conditionValue)
      case 'lt':
        return Number(fieldValue) < Number(conditionValue)
      case 'gte':
        return Number(fieldValue) >= Number(conditionValue)
      case 'lte':
        return Number(fieldValue) <= Number(conditionValue)
      case 'isEmpty':
        return !fieldValue || fieldValue === ''
      case 'isNotEmpty':
        return !!fieldValue && fieldValue !== ''
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      case 'notIn':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
      default:
        return false
    }
  })

  return logic === 'AND' ? results.every(r => r) : results.some(r => r)
}

function getEventLabel(event: TriggerEvent): string {
  return eventOptions.find(e => e.value === event)?.label || event
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`
  return date.toLocaleDateString()
}

function handleAddCondition(filter: FilterCondition) {
  triggerForm.value.conditions.push(filter)
}

function handleUpdateCondition(index: number, filter: FilterCondition) {
  triggerForm.value.conditions[index] = filter
}

function handleRemoveCondition(index: number) {
  triggerForm.value.conditions.splice(index, 1)
}

function handleClearConditions() {
  triggerForm.value.conditions = []
}


function getConditionSummary(trigger: Trigger): string {
  if (trigger.conditions.length === 0) return 'No conditions'
  if (trigger.conditions.length === 1) {
    const cond = trigger.conditions[0]
    const col = props.table.columns.find(c => c.field === cond.field)
    return `${col?.title || cond.field} ${cond.operator} ${cond.value || ''}`
  }
  return `${trigger.conditions.length} conditions (${trigger.conditionLogic})`
}

function getActionSummary(trigger: Trigger): string {
  if (trigger.actions.length === 0) return 'No actions'
  const action = trigger.actions[0]
  return action.config.workflowName || 'Unknown workflow'
}

function getColumnTitle(fieldName: string): string {
  const column = props.table.columns.find(c => c.field === fieldName)
  return column?.title || fieldName
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <div class="header-content">
        <div>
          <h2 class="section-title">Triggers & Automation</h2>
          <p class="section-description">
            Automate workflows when records change or meet specific conditions
          </p>
        </div>
          <div class="header-actions">
          <el-button @click="handleTestAllTriggers">
            <el-icon><VideoPlay /></el-icon>
            Test Triggers
          </el-button>
          <el-button type="primary" @click="handleAddTrigger">
            <el-icon><Plus /></el-icon>
            New Trigger
          </el-button>
        </div>
      </div>
    </div>

    <div class="section-content">
      <el-tabs v-model="activeTab" class="trigger-tabs">
        <!-- List View Tab -->
        <el-tab-pane label="List View" name="list">
          <template #label>
            <span class="tab-label">
              <el-icon><List /></el-icon>
              List View
            </span>
          </template>

          <!-- Triggers List -->
          <div v-if="triggers.length === 0" class="empty-state">
            <el-icon :size="48"><Lightning /></el-icon>
            <h3>No triggers configured</h3>
            <p>Set up automated workflows to respond to record changes</p>
            <el-button type="primary" @click="handleAddTrigger">
              Create First Trigger
            </el-button>
          </div>

          <div v-else class="triggers-list">
        <div
          v-for="trigger in triggers"
          :key="trigger.id"
          class="trigger-item"
          :class="{ disabled: !trigger.enabled }"
        >
          <div class="trigger-status">
            <el-switch
              :model-value="trigger.enabled"
              @change="handleToggleTrigger(trigger)"
            />
          </div>

          <div class="trigger-info">
            <div class="trigger-header">
              <h4 class="trigger-name">
                <el-icon><Lightning /></el-icon>
                {{ trigger.name }}
              </h4>
              <div class="trigger-meta">
                <el-tag size="small" type="info">
                  {{ getEventLabel(trigger.event) }}
                </el-tag>
                <span class="execution-count">{{ trigger.executionCount }} runs</span>
              </div>
            </div>

            <div class="trigger-details">
              <p class="trigger-description">{{ trigger.description }}</p>
              <div v-if="trigger.lastTriggered" class="detail-row">
                <span class="label">Last run:</span>
                <span class="value">{{ formatTimestamp(trigger.lastTriggered) }}</span>
              </div>
            </div>
          </div>

          <div class="trigger-actions">
            <el-button size="small" @click="handleEditTrigger(trigger)">
              <el-icon><Edit /></el-icon>
              Edit
            </el-button>
            <el-button size="small" type="danger" @click="handleDeleteTrigger(trigger)">
              <el-icon><Delete /></el-icon>
              Delete
            </el-button>
          </div>
        </div>
      </div>
        </el-tab-pane>

        <!-- Decision Table Tab -->
        <el-tab-pane label="Decision Table" name="decision-table">
          <template #label>
            <span class="tab-label">
              <el-icon><Grid /></el-icon>
              Decision Table
            </span>
          </template>
        <div class="decision-table-container">
          <el-alert
            title="Decision Table View"
            type="info"
            :closable="false"
            show-icon
            class="table-info"
          >
            View and manage all triggers in a structured table format. Each row represents a rule with its conditions and actions.
          </el-alert>

          <div class="decision-table">
            <table class="rule-table">
              <thead>
                <tr>
                  <th class="col-status">Status</th>
                  <th class="col-name">Trigger Name</th>
                  <th class="col-event">Event</th>
                  <th class="col-conditions">Conditions (IF)</th>
                  <th class="col-actions">Action (THEN)</th>
                  <th class="col-stats">Stats</th>
                  <th class="col-operations">Operations</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="trigger in triggers"
                  :key="trigger.id"
                  class="rule-row"
                  :class="{ disabled: !trigger.enabled }"
                >
                  <td class="col-status">
                    <el-switch
                      :model-value="trigger.enabled"
                      @change="handleToggleTrigger(trigger)"
                      size="small"
                    />
                  </td>
                  <td class="col-name">
                    <div class="name-cell">
                      <strong>{{ trigger.name }}</strong>
                      <span v-if="trigger.description" class="description">{{ trigger.description }}</span>
                    </div>
                  </td>
                  <td class="col-event">
                    <el-tag size="small" type="info">
                      {{ getEventLabel(trigger.event) }}
                    </el-tag>
                    <div v-if="trigger.watchField" class="watch-field">
                      Watching: <code>{{ trigger.watchField }}</code>
                    </div>
                  </td>
                  <td class="col-conditions">
                    <div v-if="trigger.conditions.length === 0" class="no-conditions">
                      Always
                    </div>
                    <div v-else class="conditions-cell">
                      <div
                        v-for="(condition, idx) in trigger.conditions"
                        :key="idx"
                        class="condition-item"
                      >
                        <el-tag size="small" effect="plain">
                          {{ getColumnTitle(condition.field) }}
                          <span class="operator">{{ condition.operator }}</span>
                          <span v-if="condition.value !== undefined" class="value">{{ condition.value }}</span>
                        </el-tag>
                        <span v-if="idx < trigger.conditions.length - 1" class="logic-operator">
                          {{ trigger.conditionLogic }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="col-actions">
                    <div class="action-cell">
                      <el-icon><Right /></el-icon>
                      <strong>{{ getActionSummary(trigger) }}</strong>
                      <div class="action-details">
                        <span v-if="trigger.actions[0]?.config.includeFullData">
                          <el-icon><Document /></el-icon> Full data
                        </span>
                        <span v-if="trigger.actions[0]?.config.includeRelated">
                          <el-icon><Link /></el-icon> Related
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="col-stats">
                    <div class="stats-cell">
                      <div class="stat-item">
                        <el-icon><Refresh /></el-icon>
                        {{ trigger.executionCount }}
                      </div>
                      <div v-if="trigger.lastTriggered" class="stat-item">
                        <el-icon><Clock /></el-icon>
                        {{ formatTimestamp(trigger.lastTriggered) }}
                      </div>
                    </div>
                  </td>
                  <td class="col-operations">
                    <div class="operations-cell">
                      <el-button size="small" text @click="handleEditTrigger(trigger)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button size="small" text type="danger" @click="handleDeleteTrigger(trigger)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="triggers.length === 0" class="empty-state">
            <el-icon :size="48"><Lightning /></el-icon>
            <h3>No triggers configured</h3>
            <p>Set up automated workflows to respond to record changes</p>
            <el-button type="primary" @click="handleAddTrigger">
              Create First Trigger
            </el-button>
          </div>
        </div>
        </el-tab-pane>

        <!-- Graph View Tab (Placeholder) -->
        <el-tab-pane label="Graph View" name="graph" disabled>
          <template #label>
            <span class="tab-label">
              <el-icon><TrendCharts /></el-icon>
              Graph View
              <el-tag size="small" type="info" style="margin-left: 8px;">Coming Soon</el-tag>
            </span>
          </template>

          <div class="empty-state">
            <el-icon :size="48"><TrendCharts /></el-icon>
            <h3>Graph View Coming Soon</h3>
            <p>Visualize trigger flows and dependencies in an interactive graph</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- Trigger Dialog -->
    <el-dialog
      v-model="showTriggerDialog"
      :title="editingTrigger ? 'Edit Trigger' : 'New Trigger'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form label-position="top">
        <!-- Trigger Name -->
        <el-form-item label="Trigger Name" required>
          <el-input
            v-model="triggerForm.name"
            placeholder="e.g., Send high priority tasks to review"
          />
        </el-form-item>

        <!-- Description -->
        <el-form-item label="Description (Optional)">
          <el-input
            v-model="triggerForm.description"
            type="textarea"
            :rows="2"
            placeholder="Describe what this trigger does... (will be auto-generated if left empty)"
          />
          <span class="form-hint">
            Leave empty to auto-generate based on your configuration
          </span>
        </el-form-item>

        <!-- Event Selection -->
        <el-form-item label="When" required>
          <el-radio-group v-model="triggerForm.event" class="event-group">
            <el-radio
              v-for="event in eventOptions"
              :key="event.value"
              :value="event.value"
              class="event-option"
            >
              <div class="event-content">
                <div class="event-header">
                  <el-icon>
                    <component :is="event.icon" />
                  </el-icon>
                  <strong>{{ event.label }}</strong>
                </div>
                <p>{{ event.description }}</p>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Field Selection (for field.changed) -->
        <el-form-item
          v-if="triggerForm.event === 'field.changed'"
          label="Watch Field"
          required
        >
          <el-select v-model="triggerForm.watchField" placeholder="Select field to watch">
            <el-option
              v-for="field in watchableFields"
              :key="field.id"
              :label="field.title"
              :value="field.field"
            />
          </el-select>
        </el-form-item>

        <!-- Conditions -->
        <el-form-item label="If (Conditions - Optional)">
          <div class="conditions-section">
            <FilterBuilder
              :columns="table.columns"
              :filters="triggerForm.conditions"
              @add="handleAddCondition"
              @update="handleUpdateCondition"
              @remove="handleRemoveCondition"
              @clear="handleClearConditions"
            />
            <el-radio-group 
              v-if="triggerForm.conditions.length > 1"
              v-model="triggerForm.conditionLogic" 
              size="small" 
              class="logic-group"
            >
              <el-radio value="AND">Match ALL conditions</el-radio>
              <el-radio value="OR">Match ANY condition</el-radio>
            </el-radio-group>
          </div>
        </el-form-item>

        <!-- Workflow Selection -->
        <el-form-item label="Then: Send to Workflow" required>
          <el-select
            v-model="triggerForm.workflowId"
            placeholder="Select workflow"
            @change="(val: string) => {
              const workflow = availableWorkflows.find(w => w.id === val)
              if (workflow) triggerForm.workflowName = workflow.name
            }"
          >
            <el-option
              v-for="workflow in availableWorkflows"
              :key="workflow.id"
              :label="workflow.name"
              :value="workflow.id"
            />
          </el-select>
        </el-form-item>

        <!-- Data Options -->
        <el-form-item label="Data to Send">
          <el-checkbox v-model="triggerForm.includeFullData">
            Include full record data
          </el-checkbox>
          <el-checkbox v-model="triggerForm.includeRelated">
            Include related records
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showTriggerDialog = false">Cancel</el-button>
        <el-button type="primary" @click="handleSaveTrigger">
          {{ editingTrigger ? 'Update' : 'Create' }} Trigger
        </el-button>
      </template>
    </el-dialog>

    <!-- Test Dialog -->
    <el-dialog
      v-model="showTestDialog"
      title="Test Automation Triggers"
      width="700px"
    >
      <div class="test-section">
        <div class="test-description">
          <el-icon><Warning /></el-icon>
          <div>
            <p><strong>Test which workflows would be triggered</strong></p>
            <p>Enter sample record data and select an event to see which triggers would fire</p>
          </div>
        </div>

        <!-- Event Selection -->
        <el-form label-position="top">
          <el-form-item label="Event Type" required>
            <el-select v-model="testEvent" style="width: 100%">
              <el-option
                v-for="event in eventOptions"
                :key="event.value"
                :label="event.label"
                :value="event.value"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- Sample Data -->
        <el-collapse>
          <el-collapse-item title="Sample Record Data" name="data">
            <el-form label-position="top" class="test-form">
              <el-form-item
                v-for="column in table.columns.filter(c => !['fx', 'rollup'].includes(c.type)).slice(0, 8)"
                :key="column.id"
                :label="column.title"
              >
                <el-input
                  v-if="['text', 'email', 'url', 'textarea'].includes(column.type)"
                  v-model="testData[column.field]"
                  :placeholder="`Enter ${column.title.toLowerCase()}`"
                />
                <el-input-number
                  v-else-if="column.type === 'number'"
                  v-model="testData[column.field]"
                  style="width: 100%"
                />
                <el-date-picker
                  v-else-if="column.type === 'date'"
                  v-model="testData[column.field]"
                  type="date"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
                <el-checkbox
                  v-else-if="column.type === 'checkbox'"
                  v-model="testData[column.field]"
                >
                  {{ column.title }}
                </el-checkbox>
                <el-select
                  v-else-if="column.type === 'single-select'"
                  v-model="testData[column.field]"
                  placeholder="Select..."
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in column.options"
                    :key="opt.id"
                    :label="opt.label"
                    :value="opt.id"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </el-collapse-item>
        </el-collapse>

        <el-button type="primary" @click="runTest" style="width: 100%; margin-top: 16px;">
          <el-icon><VideoPlay /></el-icon>
          Run Test
        </el-button>

        <!-- Test Results -->
        <div v-if="testResults.length > 0" class="test-results">
          <h4>Results ({{ testResults.filter(r => r.matched).length }} would trigger)</h4>
          
          <div
            v-for="result in testResults"
            :key="result.triggerId"
            class="test-result-item"
            :class="{ matched: result.matched }"
          >
            <div class="result-icon">
              <el-icon v-if="result.matched" color="#67C23A" :size="20"><CircleCheck /></el-icon>
              <el-icon v-else color="#909399" :size="20"><CircleClose /></el-icon>
            </div>
            
            <div class="result-content">
              <div class="result-title">
                <strong>{{ result.triggerName }}</strong>
                <el-tag v-if="result.matched" type="success" size="small">Would Fire</el-tag>
                <el-tag v-else type="info" size="small">No Match</el-tag>
              </div>
              <p v-if="result.description" class="result-description">{{ result.description }}</p>
              <div v-if="result.matched && result.workflow" class="result-workflow">
                → Workflow: <strong>{{ result.workflow }}</strong>
              </div>
            </div>
          </div>

          <el-alert
            v-if="testResults.filter(r => r.matched).length === 0"
            type="info"
            :closable="false"
            show-icon
          >
            No triggers would fire for this event and data combination
          </el-alert>
        </div>
      </div>

      <template #footer>
        <el-button @click="showTestDialog = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 1000px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.header-actions {
  display: flex;
  gap: var(--app-space-s);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xxl);
  text-align: center;
  gap: var(--app-space-m);

  .el-icon {
    color: var(--app-text-color-placeholder);
  }

  h3 {
    margin: 0;
    font-size: var(--app-font-size-xl);
    color: var(--app-text-color-primary);
  }

  p {
    margin: 0;
    color: var(--app-text-color-secondary);
  }
}

.triggers-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.trigger-item {
  display: flex;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--app-fill-color-light);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  transition: all 0.2s ease;

  &.disabled {
    opacity: 0.6;
  }

  &:hover {
    border-color: var(--app-primary-color-light-7);
    background: var(--app-paper);
  }
}

.trigger-status {
  flex-shrink: 0;
}

.trigger-info {
  flex: 1;
  min-width: 0;
}

.trigger-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--app-space-s);
}

.trigger-name {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  margin: 0;
  font-size: var(--app-font-size-l);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.trigger-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.execution-count {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.trigger-details {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.trigger-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  line-height: 1.5;
  color: var(--app-text-color-primary);
}

.detail-row {
  display: flex;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);

  .label {
    font-weight: 500;
    color: var(--app-text-color-secondary);
  }

  .value {
    color: var(--app-text-color-secondary);
  }
}

.trigger-actions {
  display: flex;
  gap: var(--app-space-xs);
  flex-shrink: 0;
}

.event-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  width: 100%;
}

.event-option {
  height: auto;
  margin-right: 0;
  padding: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);

  :deep(.el-radio__label) {
    width: 100%;
    padding-left: 0;
  }
}

.event-content {
  flex: 1;

  .event-header {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    margin-bottom: var(--app-space-xxs);

    strong {
      font-size: var(--app-font-size-m);
    }
  }

  p {
    margin: 0;
    font-size: var(--app-font-size-s);
    color: var(--app-text-color-secondary);
  }
}

.conditions-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--app-fill-color-light);
  border-radius: var(--app-border-radius-s);
}

.logic-group {
  display: flex;
  gap: var(--app-space-m);
}

.test-section {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.test-description {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-m);
  background: var(--app-warning-color-light-9);
  border-radius: var(--app-border-radius-s);

  .el-icon {
    color: var(--app-warning-color);
  }

  p {
    margin: 0;
    color: var(--app-text-color-secondary);
  }
}

.test-form {
  max-height: 400px;
  overflow-y: auto;
}

.test-results {
  margin-top: var(--app-space-l);
  
  h4 {
    margin: 0 0 var(--app-space-m) 0;
    font-size: var(--app-font-size-l);
    font-weight: 600;
  }
}

.test-result-item {
  display: flex;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  margin-bottom: var(--app-space-s);
  border: 2px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  background: var(--app-fill-color-light);

  &.matched {
    border-color: var(--app-success-color);
    background: var(--app-success-color-light-9);
  }
}

.result-icon {
  flex-shrink: 0;
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-xs);

  strong {
    font-size: var(--app-font-size-m);
  }
}

.result-description {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.result-workflow {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);

  strong {
    color: var(--app-primary-color);
  }
}

.form-hint {
  display: block;
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  font-style: italic;
}

// Tabs Styles
.trigger-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: var(--app-space-l);
  }

  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }

  :deep(.el-tabs__item) {
    font-size: var(--app-font-size-m);
    height: 44px;
    line-height: 44px;
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

// Decision Table Styles
.decision-table-container {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-l);
}

.table-info {
  margin-bottom: var(--app-space-m);
}

.decision-table {
  overflow-x: auto;
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
}

.rule-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--app-fill-color-blank);
  font-size: var(--app-font-size-s);

  thead {
    background: var(--app-fill-color);
    
    tr {
      border-bottom: 2px solid var(--app-border-color);
    }
    
    th {
      padding: var(--app-space-m);
      text-align: left;
      font-weight: 600;
      color: var(--app-text-color-primary);
      white-space: nowrap;
      font-size: var(--app-font-size-s);
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--app-border-color-lighter);
      transition: background-color 0.2s;

      &:hover {
        background: var(--app-fill-color-light);
      }

      &.disabled {
        opacity: 0.5;
        background: var(--app-fill-color);
      }
    }

    td {
      padding: var(--app-space-m);
      vertical-align: top;
    }
  }
}

.col-status {
  width: 60px;
  text-align: center;
}

.col-name {
  min-width: 200px;
  max-width: 250px;
}

.col-event {
  min-width: 140px;
  width: 180px;
}

.col-conditions {
  min-width: 250px;
}

.col-actions {
  min-width: 200px;
}

.col-stats {
  width: 120px;
}

.col-operations {
  width: 100px;
  text-align: center;
}

.name-cell {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);

  strong {
    font-size: var(--app-font-size-m);
    color: var(--app-text-color-primary);
  }

  .description {
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-secondary);
    line-height: 1.4;
  }
}

.watch-field {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);

  code {
    padding: 2px 4px;
    background: var(--app-fill-color);
    border-radius: 2px;
    font-family: monospace;
    font-size: 11px;
  }
}

.no-conditions {
  color: var(--app-text-color-placeholder);
  font-style: italic;
}

.conditions-cell {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.condition-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);

  .el-tag {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .operator {
    color: var(--app-text-color-secondary);
    font-weight: 500;
  }

  .value {
    color: var(--app-primary-color);
    font-weight: 600;
  }

  .logic-operator {
    font-size: var(--app-font-size-xs);
    font-weight: 600;
    color: var(--app-warning-color);
    padding: 2px 6px;
    background: var(--app-warning-color-light-9);
    border-radius: 2px;
  }
}

.action-cell {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  align-items: flex-start;

  strong {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    color: var(--app-success-color);
  }

  .action-details {
    display: flex;
    gap: var(--app-space-s);
    font-size: var(--app-font-size-xs);
    color: var(--app-text-color-secondary);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.stats-cell {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
}

.operations-cell {
  display: flex;
  gap: var(--app-space-xs);
  justify-content: center;
}
</style>

