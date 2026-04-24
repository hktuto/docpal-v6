<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import type { CaseViewRecord, CaseFieldRecord, ViewSettings, ViewType } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()

const { query } = usePglite()

const loading = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const allFields = ref<CaseFieldRecord[]>([])
const selectedViewType = ref<ViewType>('table')

const viewTypeOptions = [
  { label: 'Table', value: 'table', icon: 'material-symbols:table-outline', description: 'Display data in a grid format' },
  { label: 'Kanban', value: 'kanban', icon: 'material-symbols:view-kanban-outline', description: 'Organize cards in columns by status' },
  { label: 'Gantt', value: 'gantt', icon: 'material-symbols:view-timeline-outline', description: 'Visualize tasks on a timeline' },
  { label: 'Calendar', value: 'calendar', icon: 'material-symbols:calendar-month-outline', description: 'View events on a calendar' }
]

// Form data for different view types
const kanbanSettings = reactive({
  groupByField: ''
})

const ganttSettings = reactive({
  startField: '',
  endField: '',
  percentField: ''
})

const calendarSettings = reactive({
  startField: '',
  endField: ''
})

// Get date fields for gantt/calendar
const dateFields = computed(() => {
  return allFields.value.filter(f => 
    f.businessType === 'date' || 
    f.fieldType === 'timestamp' ||
    f.displayStructure?.type === 6
  )
})

// Get number fields for gantt percent
const numberFields = computed(() => {
  return allFields.value.filter(f => 
    f.businessType === 'number' || 
    f.fieldType === 'integer' ||
    f.fieldType === 'numeric' ||
    f.displayStructure?.type === 2
  )
})

// Get groupable fields for kanban
const groupableFields = computed(() => {
  return allFields.value.filter(f => 
    f.displayStructure?.type === 3 ||
    f.displayStructure?.type === 4 ||
    f.businessType === 'text'
  )
})

// Check if type has changed
const hasTypeChanged = computed(() => {
  return viewData.value && selectedViewType.value !== viewData.value.viewType
})

async function loadData() {
  if (!props.menuItem?.itemId) return
  
  loading.value = true
  try {
    // Load view
    const views = await query<CaseViewRecord>(
      `SELECT * FROM case_views WHERE id = $1`,
      [props.menuItem.itemId]
    )
    
    if (views.length > 0) {
      viewData.value = views[0]
      selectedViewType.value = views[0].viewType || 'table'
      
      // Load settings based on view type
      const settings = views[0].viewSettings
      if (settings) {
        if (settings.kanban) {
          kanbanSettings.groupByField = settings.kanban.groupByField || ''
        }
        if (settings.gantt) {
          ganttSettings.startField = settings.gantt.startField || ''
          ganttSettings.endField = settings.gantt.endField || ''
          ganttSettings.percentField = settings.gantt.percentField || ''
        }
        if (settings.calendar) {
          calendarSettings.startField = settings.calendar.startField || ''
          calendarSettings.endField = settings.calendar.endField || ''
        }
      }
      
      // Load all fields from the base table
      const fields = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias"`,
        [views[0].tableId]
      )
      allFields.value = fields
    }
  } catch (error) {
    console.error('Error loading data:', error)
    ElMessage.error('Failed to load view settings')
  } finally {
    loading.value = false
  }
}

function handleViewTypeChange(newType: ViewType) {
  // Reset type-specific settings when changing type
  kanbanSettings.groupByField = ''
  ganttSettings.startField = ''
  ganttSettings.endField = ''
  ganttSettings.percentField = ''
  calendarSettings.startField = ''
  calendarSettings.endField = ''
  
  // Restore settings if switching back to original type
  if (viewData.value && newType === viewData.value.viewType) {
    const settings = viewData.value.viewSettings
    if (settings) {
      if (settings.kanban) {
        kanbanSettings.groupByField = settings.kanban.groupByField || ''
      }
      if (settings.gantt) {
        ganttSettings.startField = settings.gantt.startField || ''
        ganttSettings.endField = settings.gantt.endField || ''
        ganttSettings.percentField = settings.gantt.percentField || ''
      }
      if (settings.calendar) {
        calendarSettings.startField = settings.calendar.startField || ''
        calendarSettings.endField = settings.calendar.endField || ''
      }
    }
  }
  
  selectedViewType.value = newType
}

async function handleSave() {
  if (!viewData.value) return
  
  // Validate settings based on selected type
  switch (selectedViewType.value) {
    case 'kanban':
      if (!kanbanSettings.groupByField) {
        ElMessage.warning('Please select a group by field for Kanban view')
        return
      }
      break
    case 'gantt':
      if (!ganttSettings.startField || !ganttSettings.endField) {
        ElMessage.warning('Please select start and end fields for Gantt view')
        return
      }
      break
    case 'calendar':
      if (!calendarSettings.startField || !calendarSettings.endField) {
        ElMessage.warning('Please select start and end fields for Calendar view')
        return
      }
      break
  }
  
  // Confirm type change if different
  if (hasTypeChanged.value) {
    try {
      await ElMessageBox.confirm(
        `Changing the view type from "${viewData.value.viewType}" to "${selectedViewType.value}" will update how this view displays data. Continue?`,
        'Change View Type',
        {
          confirmButtonText: 'Change Type',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )
    } catch {
      return // User cancelled
    }
  }
  
  loading.value = true
  try {
    // Build view settings based on type
    const settings: ViewSettings = {}
    
    switch (selectedViewType.value) {
      case 'kanban':
        settings.kanban = {
          groupByField: kanbanSettings.groupByField
        }
        break
      case 'gantt':
        settings.gantt = {
          startField: ganttSettings.startField,
          endField: ganttSettings.endField,
          percentField: ganttSettings.percentField || undefined
        }
        break
      case 'calendar':
        settings.calendar = {
          startField: calendarSettings.startField,
          endField: calendarSettings.endField
        }
        break
    }
    
    await query(
      `UPDATE case_views SET "viewType" = $1, "viewSettings" = $2, "updatedAt" = $3 WHERE id = $4`,
      [selectedViewType.value, JSON.stringify(settings), new Date(), viewData.value.id]
    )
    
    // Update local data
    viewData.value.viewType = selectedViewType.value
    viewData.value.viewSettings = settings
    
    ElMessage.success('View settings saved successfully')
  } catch (error) {
    console.error('Error saving settings:', error)
    ElMessage.error('Failed to save view settings')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

watch(() => props.menuItem?.itemId, () => {
  loadData()
})
</script>

<template>
  <div class="view-type-settings">
    <div class="section-header">
      <h2>View Type & Settings</h2>
      <p>Change the view type and configure type-specific settings.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else-if="viewData">
      <!-- View Type Selector -->
      <div class="view-type-section">
        <h3>View Type</h3>
        <div class="view-type-grid">
          <div
            v-for="option in viewTypeOptions"
            :key="option.value"
            class="view-type-option"
            :class="{ active: selectedViewType === option.value }"
            tabindex="0"
            :aria-label="`Select ${option.label} view type`"
            @click="handleViewTypeChange(option.value as ViewType)"
            @keydown.enter="handleViewTypeChange(option.value as ViewType)"
          >
            <Icon :name="option.icon" class="option-icon" />
            <div class="option-content">
              <div class="option-label">{{ option.label }}</div>
              <div class="option-description">{{ option.description }}</div>
            </div>
          </div>
        </div>
        
        <el-alert
          v-if="hasTypeChanged"
          title="View type will be changed"
          type="warning"
          :closable="false"
          show-icon
          class="type-change-warning"
        >
          Changing from "{{ viewData.viewType }}" to "{{ selectedViewType }}"
        </el-alert>
      </div>

      <el-divider />

      <!-- Type-specific Settings -->
      <div class="type-settings-section">
        <h3>Type Settings</h3>
        
        <!-- Table View - No special settings -->
        <template v-if="selectedViewType === 'table'">
          <el-alert
            title="Table View"
            type="info"
            :closable="false"
            show-icon
          >
            Table views use the default column configuration. 
            Adjust visible columns in the Fields section.
          </el-alert>
        </template>

        <!-- Kanban View Settings -->
        <template v-else-if="selectedViewType === 'kanban'">
          <el-form label-position="top">
            <el-form-item label="Group By Field" required>
              <el-select
                v-model="kanbanSettings.groupByField"
                placeholder="Select field to group cards by"
                style="width: 100%"
              >
                <el-option
                  v-for="field in groupableFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
              <div class="field-hint">
                Cards will be organized into columns based on this field's values.
              </div>
            </el-form-item>
            
            <el-alert
              v-if="groupableFields.length === 0"
              title="No groupable fields"
              type="warning"
              :closable="false"
              show-icon
            >
              This table has no select or text fields that can be used for grouping.
            </el-alert>
          </el-form>
        </template>

        <!-- Gantt View Settings -->
        <template v-else-if="selectedViewType === 'gantt'">
          <el-form label-position="top">
            <el-form-item label="Start Date Field" required>
              <el-select
                v-model="ganttSettings.startField"
                placeholder="Select start date field"
                style="width: 100%"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="End Date Field" required>
              <el-select
                v-model="ganttSettings.endField"
                placeholder="Select end date field"
                style="width: 100%"
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
                v-model="ganttSettings.percentField"
                placeholder="Select percent complete field"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="field in numberFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
              <div class="field-hint">
                Optional: Shows task progress as a percentage.
              </div>
            </el-form-item>
            
            <el-alert
              v-if="dateFields.length === 0"
              title="No date fields"
              type="warning"
              :closable="false"
              show-icon
            >
              This table has no date fields. Please add date fields first.
            </el-alert>
          </el-form>
        </template>

        <!-- Calendar View Settings -->
        <template v-else-if="selectedViewType === 'calendar'">
          <el-form label-position="top">
            <el-form-item label="Start Date Field" required>
              <el-select
                v-model="calendarSettings.startField"
                placeholder="Select start date field"
                style="width: 100%"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="End Date Field" required>
              <el-select
                v-model="calendarSettings.endField"
                placeholder="Select end date field"
                style="width: 100%"
              >
                <el-option
                  v-for="field in dateFields"
                  :key="field.id"
                  :label="field.fieldNameAlias"
                  :value="field.fieldName"
                />
              </el-select>
            </el-form-item>
            
            <el-alert
              v-if="dateFields.length === 0"
              title="No date fields"
              type="warning"
              :closable="false"
              show-icon
            >
              This table has no date fields. Please add date fields first.
            </el-alert>
          </el-form>
        </template>
      </div>

      <!-- Save Button -->
      <div class="actions">
        <el-button type="primary" :loading="loading" @click="handleSave">
          Save Settings
        </el-button>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-type-settings {
  max-width: 700px;
}

.section-header {
  margin-bottom: var(--app-space-l);
  
  h2 {
    margin: 0 0 var(--app-space-xs);
    font-size: var(--app-font-size-xl);
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
}

.loading-state {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  color: var(--el-text-color-secondary);
  padding: var(--app-space-l);
}

.view-type-section,
.type-settings-section {
  h3 {
    margin: 0 0 var(--app-space-m);
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
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

.type-change-warning {
  margin-top: var(--app-space-m);
}

.field-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
}

.actions {
  margin-top: var(--app-space-l);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--el-border-color);
}
</style>
