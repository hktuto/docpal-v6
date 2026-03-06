<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CaseTableRecord, CaseFieldRecord, ViewType, ViewSettings } from '../../../../utils/db/schema/newTableSchema'

interface ViewFormData {
  name: string
  tableId: string
  viewType: ViewType
  // Kanban settings
  kanbanGroupByField: string
  // Gantt settings
  ganttStartField: string
  ganttEndField: string
  ganttPercentField: string
  // Calendar settings
  calendarStartField: string
  calendarEndField: string
}

const { query } = usePglite()
const { workspace } = useSingleWorkspaceContext()

const emit = defineEmits<{
  created: [data: {
    name: string
    tableId: string
    viewType: ViewType
    viewSettings: ViewSettings
  }]
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const availableTables = ref<CaseTableRecord[]>([])
const tableFields = ref<CaseFieldRecord[]>([])

const formData = reactive<ViewFormData>({
  name: '',
  tableId: '',
  viewType: 'table',
  kanbanGroupByField: '',
  ganttStartField: '',
  ganttEndField: '',
  ganttPercentField: '',
  calendarStartField: '',
  calendarEndField: ''
})

const viewTypeOptions = [
  { label: 'Table', value: 'table', icon: 'material-symbols:table-outline', description: 'Display data in a grid format' },
  { label: 'Kanban', value: 'kanban', icon: 'material-symbols:view-kanban-outline', description: 'Organize cards in columns by status' },
  { label: 'Gantt', value: 'gantt', icon: 'material-symbols:view-timeline-outline', description: 'Visualize tasks on a timeline' },
  { label: 'Calendar', value: 'calendar', icon: 'material-symbols:calendar-month-outline', description: 'View events on a calendar' }
]

// Get date fields for gantt/calendar
const dateFields = computed(() => {
  return tableFields.value.filter(f => 
    f.businessType === 'date' || 
    f.fieldType === 'timestamp' ||
    f.displayStructure?.type === ColumnFieldType.DateTime
  )
})

// Get number fields for gantt percent
const numberFields = computed(() => {
  return tableFields.value.filter(f => 
    f.businessType === 'number' || 
    f.fieldType === 'integer' ||
    f.fieldType === 'numeric' ||
    f.displayStructure?.type === ColumnFieldType.Number
  )
})

// Get all fields for kanban grouping (typically select/status fields)
const groupableFields = computed(() => {
  return tableFields.value.filter(f => 
    f.displayStructure?.type === ColumnFieldType.SingleSelect ||
    f.displayStructure?.type === ColumnFieldType.MultiSelect ||
    f.businessType === 'text' // Also allow text fields
  )
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: 'Please enter a view name', trigger: 'blur' }],
  tableId: [{ required: true, message: 'Please select a base table', trigger: 'change' }],
  viewType: [{ required: true, message: 'Please select a view type', trigger: 'change' }],
  kanbanGroupByField: [{ 
    required: formData.viewType === 'kanban', 
    message: 'Please select a group by field for Kanban view', 
    trigger: 'change' 
  }],
  ganttStartField: [{ 
    required: formData.viewType === 'gantt', 
    message: 'Please select a start date field for Gantt view', 
    trigger: 'change' 
  }],
  ganttEndField: [{ 
    required: formData.viewType === 'gantt', 
    message: 'Please select an end date field for Gantt view', 
    trigger: 'change' 
  }],
  calendarStartField: [{ 
    required: formData.viewType === 'calendar', 
    message: 'Please select a start date field for Calendar view', 
    trigger: 'change' 
  }],
  calendarEndField: [{ 
    required: formData.viewType === 'calendar', 
    message: 'Please select an end date field for Calendar view', 
    trigger: 'change' 
  }]
}))

const canCreate = computed(() => {
  if (!formData.name || !formData.tableId || !formData.viewType) return false
  
  switch (formData.viewType) {
    case 'kanban':
      return !!formData.kanbanGroupByField
    case 'gantt':
      return !!formData.ganttStartField && !!formData.ganttEndField
    case 'calendar':
      return !!formData.calendarStartField && !!formData.calendarEndField
    default:
      return true
  }
})

async function open() {
  visible.value = true
  await loadAvailableTables()
}

async function loadAvailableTables() {
  try {
    if (!workspace.value?.id) {
      ElMessage.error('Workspace not found')
      return
    }
    
    const tables = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE "entityId" = $1 AND status = 'A' ORDER BY name ASC`,
      [workspace.value.id]
    )
    availableTables.value = tables
  } catch (error) {
    console.error('Error loading tables:', error)
    ElMessage.error('Failed to load tables')
  }
}

async function handleTableChange() {
  // Reset type-specific fields when table changes
  formData.kanbanGroupByField = ''
  formData.ganttStartField = ''
  formData.ganttEndField = ''
  formData.ganttPercentField = ''
  formData.calendarStartField = ''
  formData.calendarEndField = ''
  tableFields.value = []
  
  if (!formData.tableId) return
  
  try {
    const fields = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias" ASC`,
      [formData.tableId]
    )
    tableFields.value = fields
    
    // Set default view name based on table name
    const selectedTable = availableTables.value.find(t => t.id === formData.tableId)
    if (selectedTable && !formData.name) {
      formData.name = `${selectedTable.name} View`
    }
  } catch (error) {
    console.error('Error loading fields:', error)
    ElMessage.error('Failed to load table fields')
  }
}

function handleViewTypeChange() {
  // Reset type-specific fields when view type changes
  formData.kanbanGroupByField = ''
  formData.ganttStartField = ''
  formData.ganttEndField = ''
  formData.ganttPercentField = ''
  formData.calendarStartField = ''
  formData.calendarEndField = ''
}

async function handleCreate() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // Build view settings based on view type
    const viewSettings: ViewSettings = {}
    
    switch (formData.viewType) {
      case 'kanban':
        viewSettings.kanban = {
          groupByField: formData.kanbanGroupByField
        }
        break
      case 'gantt':
        viewSettings.gantt = {
          startField: formData.ganttStartField,
          endField: formData.ganttEndField,
          percentField: formData.ganttPercentField || undefined
        }
        break
      case 'calendar':
        viewSettings.calendar = {
          startField: formData.calendarStartField,
          endField: formData.calendarEndField
        }
        break
    }
    
    emit('created', {
      name: formData.name,
      tableId: formData.tableId,
      viewType: formData.viewType,
      viewSettings
    })
    
    handleClose()
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  formRef.value?.resetFields()
  tableFields.value = []
  Object.assign(formData, {
    name: '',
    tableId: '',
    viewType: 'table',
    kanbanGroupByField: '',
    ganttStartField: '',
    ganttEndField: '',
    ganttPercentField: '',
    calendarStartField: '',
    calendarEndField: ''
  })
}

defineExpose({
  open
})
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Create View"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-view-dialog">
      <div class="description">
        Create a custom view to display your data in different formats. Choose a base table and view type.
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="View Name" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="Enter view name"
          />
        </el-form-item>

        <el-form-item label="Base Table" prop="tableId">
          <el-select
            v-model="formData.tableId"
            placeholder="Select a table"
            style="width: 100%"
            @change="handleTableChange"
          >
            <el-option
              v-for="table in availableTables"
              :key="table.id"
              :label="table.name"
              :value="table.id"
            >
              <div class="table-option">
                <Icon name="material-symbols:table-outline" />
                <span>{{ table.name }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="View Type" prop="viewType">
          <div class="view-type-grid">
            <div
              v-for="option in viewTypeOptions"
              :key="option.value"
              class="view-type-option"
              :class="{ active: formData.viewType === option.value }"
              tabindex="0"
              :aria-label="`Select ${option.label} view type`"
              @click="formData.viewType = option.value as ViewType; handleViewTypeChange()"
              @keydown.enter="formData.viewType = option.value as ViewType; handleViewTypeChange()"
            >
              <Icon :name="option.icon" class="option-icon" />
              <div class="option-content">
                <div class="option-label">{{ option.label }}</div>
                <div class="option-description">{{ option.description }}</div>
              </div>
            </div>
          </div>
        </el-form-item>

        <!-- Kanban Settings -->
        <template v-if="formData.viewType === 'kanban'">
          <div class="type-settings">
            <div class="settings-header">
              <Icon name="material-symbols:view-kanban-outline" />
              <span>Kanban Settings</span>
            </div>
            
            <el-form-item label="Group By Field" prop="kanbanGroupByField">
              <el-select
                v-model="formData.kanbanGroupByField"
                placeholder="Select field to group cards by"
                style="width: 100%"
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in groupableFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                >
                  <div class="field-option">
                    <span>{{ field.fieldNameAlias }}</span>
                    <span class="field-name">{{ field.fieldName }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="field-hint">
                Cards will be organized into columns based on this field's values
              </div>
            </el-form-item>
          </div>
        </template>

        <!-- Gantt Settings -->
        <template v-if="formData.viewType === 'gantt'">
          <div class="type-settings">
            <div class="settings-header">
              <Icon name="material-symbols:view-timeline-outline" />
              <span>Gantt Settings</span>
            </div>
            
            <el-form-item label="Start Date Field" prop="ganttStartField">
              <el-select
                v-model="formData.ganttStartField"
                placeholder="Select start date field"
                style="width: 100%"
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="End Date Field" prop="ganttEndField">
              <el-select
                v-model="formData.ganttEndField"
                placeholder="Select end date field"
                style="width: 100%"
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="Progress Field (Optional)">
              <el-select
                v-model="formData.ganttPercentField"
                placeholder="Select percent complete field"
                style="width: 100%"
                clearable
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in numberFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
              <div class="field-hint">
                Optional: Shows task progress as a percentage
              </div>
            </el-form-item>
          </div>
        </template>

        <!-- Calendar Settings -->
        <template v-if="formData.viewType === 'calendar'">
          <div class="type-settings">
            <div class="settings-header">
              <Icon name="material-symbols:calendar-month-outline" />
              <span>Calendar Settings</span>
            </div>
            
            <el-form-item label="Start Date Field" prop="calendarStartField">
              <el-select
                v-model="formData.calendarStartField"
                placeholder="Select start date field"
                style="width: 100%"
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="End Date Field" prop="calendarEndField">
              <el-select
                v-model="formData.calendarEndField"
                placeholder="Select end date field"
                style="width: 100%"
                :disabled="!formData.tableId"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
          </div>
        </template>

        <!-- No fields warning -->
        <div v-if="formData.tableId && formData.viewType !== 'table'" class="no-fields-warning">
          <template v-if="formData.viewType === 'kanban' && groupableFields.length === 0">
            <el-alert
              title="No groupable fields found"
              type="warning"
              :closable="false"
              show-icon
            >
              This table has no select or text fields that can be used for grouping.
              Please add a field with options first.
            </el-alert>
          </template>
          <template v-if="(formData.viewType === 'gantt' || formData.viewType === 'calendar') && dateFields.length === 0">
            <el-alert
              title="No date fields found"
              type="warning"
              :closable="false"
              show-icon
            >
              This table has no date fields. Please add date fields for start and end dates first.
            </el-alert>
          </template>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          Create View
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.create-view-dialog {
  .description {
    margin-bottom: var(--app-space-l);
    padding: var(--app-space-m);
    background: var(--app-grey-950);
    border-radius: var(--app-border-radius);
    color: var(--app-grey-400);
    font-size: var(--app-font-size-s);
  }
}

.table-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.view-type-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--app-space-m);
}

.view-type-option {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-m);
  padding: var(--app-space-m);
  border: 2px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
  
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    
    .option-icon {
      color: var(--el-color-primary);
    }
  }
  
  .option-icon {
    font-size: 24px;
    color: var(--el-text-color-secondary);
    flex-shrink: 0;
  }
  
  .option-content {
    flex: 1;
    min-width: 0;
  }
  
  .option-label {
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin-bottom: 2px;
  }
  
  .option-description {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
}

.type-settings {
  margin-top: var(--app-space-m);
  padding: var(--app-space-m);
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--el-border-color-light);
}

.settings-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
  font-weight: 600;
  color: var(--el-text-color-primary);
  
  .iconify {
    font-size: 18px;
    color: var(--el-color-primary);
  }
}

.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .field-name {
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-500);
    font-family: monospace;
  }
}

.field-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
}

.no-fields-warning {
  margin-top: var(--app-space-m);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
