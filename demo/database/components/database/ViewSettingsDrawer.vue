<script lang="ts" setup>
import type { 
  Table, 
  View, 
  ViewType, 
  VisibleColumn, 
  FilterCondition, 
  SortConfig,
  RelatedTableInfo,
  Column
} from '../../types/database'
import { Delete, Plus, View as ViewIcon } from '@element-plus/icons-vue'
import FilterBuilder from './FilterBuilder.vue'
import SortBuilder from './SortBuilder.vue'
import ColumnSelector from './ColumnSelector.vue'

const props = defineProps<{
  modelValue: boolean
  table: Table
  view: View
  visibleColumns: VisibleColumn[]
  filters: FilterCondition[]
  sorting: SortConfig[]
  relatedTables: RelatedTableInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [settings: {
    name: string
    type: ViewType
    config: any
    filters: FilterCondition[]
    sorting: SortConfig[]
    columns: VisibleColumn[]
  }]
  preview: [settings: {
    name: string
    type: ViewType
    config: any
    filters: FilterCondition[]
    sorting: SortConfig[]
    columns: VisibleColumn[]
  }]
  cancel: []
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ============ Local State (not applied until Save) ============

// View name
const localName = ref('')

// View type
const localViewType = ref<ViewType>('table')

// View-specific config
const localTableGroupBy = ref('')
const localTableGroupBySecondary = ref('')
const localTableAggregations = ref<{ field: string; type: 'sum' | 'avg' | 'min' | 'max' | 'count' }[]>([])
const localKanbanGroupBy = ref('')
const localGanttStartField = ref('')
const localGanttEndField = ref('')
const localGanttTitleField = ref('')
const localCalendarDateField = ref('')
const localGalleryTitleField = ref('')

// Filters and sorting
const localFilters = ref<FilterCondition[]>([])
const localSorting = ref<SortConfig[]>([])

// Columns
const localColumns = ref<VisibleColumn[]>([])

// Preview mode
const isPreviewing = ref(false)

// Track if there are changes
const hasChanges = computed(() => {
  const nameChanged = localName.value !== props.view.name
  const typeChanged = localViewType.value !== props.view.type
  const filtersChanged = JSON.stringify(localFilters.value) !== JSON.stringify(props.filters)
  const sortingChanged = JSON.stringify(localSorting.value) !== JSON.stringify(props.sorting)
  const columnsChanged = JSON.stringify(localColumns.value) !== JSON.stringify(props.visibleColumns)
  
  return nameChanged || typeChanged || filtersChanged || sortingChanged || columnsChanged
})

// Initialize local state when drawer opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    initializeLocalState()
  }
})

function initializeLocalState() {
  // Reset preview mode
  isPreviewing.value = false
  
  // Copy all values from props to local state
  localName.value = props.view.name
  localViewType.value = props.view.type
  
  // View-specific config
  localTableGroupBy.value = props.view.config?.groupBy?.field || ''
  localTableGroupBySecondary.value = props.view.config?.groupBy?.secondaryField || ''
  localTableAggregations.value = props.view.config?.groupBy?.aggregations || []
  localKanbanGroupBy.value = props.view.config?.kanban?.groupByField || props.view.config?.groupByField || ''
  localGanttStartField.value = props.view.config?.gantt?.startDateField || props.view.config?.startDateField || ''
  localGanttEndField.value = props.view.config?.gantt?.endDateField || props.view.config?.endDateField || ''
  localGanttTitleField.value = props.view.config?.gantt?.titleField || props.view.config?.titleField || ''
  localCalendarDateField.value = props.view.config?.calendar?.dateField || props.view.config?.dateField || ''
  localGalleryTitleField.value = props.view.config?.gallery?.titleField || props.view.config?.titleField || ''
  
  // Deep copy filters and sorting
  localFilters.value = JSON.parse(JSON.stringify(props.filters))
  localSorting.value = JSON.parse(JSON.stringify(props.sorting))
  
  // Deep copy columns
  localColumns.value = JSON.parse(JSON.stringify(props.visibleColumns))
}

// View type options (no emojis)
const viewTypeOptions: { value: ViewType; label: string; description: string }[] = [
  { value: 'table', label: 'Table', description: 'Grid view with rows and columns' },
  { value: 'kanban', label: 'Kanban', description: 'Cards grouped by a field' },
  { value: 'gantt', label: 'Gantt', description: 'Timeline with date ranges' },
  { value: 'calendar', label: 'Calendar', description: 'Events on a calendar' },
  { value: 'gallery', label: 'Gallery', description: 'Card-based gallery view' }
]

// Get columns suitable for groupBy (single-select, user, checkbox, switch, relation)
const groupByColumns = computed(() => {
  const baseColumns = props.table.columns.filter(c => 
    c.type === 'single-select' || 
    c.type === 'user' || 
    c.type === 'checkbox' || 
    c.type === 'switch' ||
    c.type === 'relation'
  )
  
  return baseColumns
})

// Get date columns
const dateColumns = computed(() => {
  return props.table.columns.filter(c => c.type === 'date')
})

// Get text/title columns
const textColumns = computed(() => {
  return props.table.columns.filter(c => c.type === 'text' || c.type === 'textarea')
})

// Get number columns (for aggregations)
const numberColumns = computed(() => {
  return props.table.columns.filter(c => 
    c.type === 'number' || 
    c.type === 'rollup' || 
    c.type === 'fx'
  )
})

// All columns for filter/sort
const allColumns = computed((): Column[] => {
  return props.table.columns
})

// ============ Local Filter Handlers ============

function handleAddFilter(filter: FilterCondition) {
  localFilters.value.push(filter)
}

function handleUpdateFilter(index: number, filter: FilterCondition) {
  if (index >= 0 && index < localFilters.value.length) {
    localFilters.value[index] = filter
  }
}

function handleRemoveFilter(index: number) {
  localFilters.value.splice(index, 1)
}

function handleClearFilters() {
  localFilters.value = []
}

// ============ Local Sort Handlers ============

function handleAddSort(sort: SortConfig) {
  // Remove existing sort for same field
  const existingIndex = localSorting.value.findIndex(s => s.field === sort.field)
  if (existingIndex !== -1) {
    localSorting.value.splice(existingIndex, 1)
  }
  localSorting.value.push(sort)
}

function handleUpdateSort(index: number, sort: SortConfig) {
  if (index >= 0 && index < localSorting.value.length) {
    localSorting.value[index] = sort
  }
}

function handleRemoveSort(index: number) {
  localSorting.value.splice(index, 1)
}

function handleClearSorting() {
  localSorting.value = []
}

// ============ Local Column Handlers ============

function handleToggleColumn(columnId: string, visible?: boolean) {
  const index = localColumns.value.findIndex(c => c.id === columnId)
  if (index !== -1) {
    localColumns.value[index] = {
      ...localColumns.value[index],
      visible: visible !== undefined ? visible : !localColumns.value[index].visible
    }
  }
}

function handleAddColumn(column: Omit<VisibleColumn, 'id' | 'order'>) {
  const maxOrder = localColumns.value.reduce((max, c) => Math.max(max, c.order), 0)
  localColumns.value.push({
    ...column,
    id: `vcol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    order: maxOrder + 1
  } as VisibleColumn)
}

function handleRemoveColumn(columnId: string) {
  localColumns.value = localColumns.value.filter(c => c.id !== columnId)
}

// ============ Build Settings Object ============

function buildSettings() {
  // Build view-specific config
  const config: any = { ...props.view.config }
  
  if (localViewType.value === 'table') {
    // Table view grouping
    if (localTableGroupBy.value) {
      config.groupBy = {
        field: localTableGroupBy.value,
        secondaryField: localTableGroupBySecondary.value || undefined,
        collapsed: props.view.config?.groupBy?.collapsed || [],
        showEmptyGroups: props.view.config?.groupBy?.showEmptyGroups ?? true,
        aggregations: localTableAggregations.value.length > 0 ? localTableAggregations.value : undefined
      }
    } else {
      // Clear groupBy if no field selected
      delete config.groupBy
    }
  } else if (localViewType.value === 'kanban') {
    config.kanban = { groupByField: localKanbanGroupBy.value }
    config.groupByField = localKanbanGroupBy.value
  } else if (localViewType.value === 'gantt') {
    config.gantt = {
      startDateField: localGanttStartField.value,
      endDateField: localGanttEndField.value,
      titleField: localGanttTitleField.value
    }
    config.startDateField = localGanttStartField.value
    config.endDateField = localGanttEndField.value
    config.titleField = localGanttTitleField.value
  } else if (localViewType.value === 'calendar') {
    config.calendar = { dateField: localCalendarDateField.value }
    config.dateField = localCalendarDateField.value
  } else if (localViewType.value === 'gallery') {
    config.gallery = { titleField: localGalleryTitleField.value }
    config.titleField = localGalleryTitleField.value
  }
  
  // Add filters and sorting to config
  config.filters = localFilters.value
  config.sorting = localSorting.value
  
  return {
    name: localName.value,
    type: localViewType.value,
    config,
    filters: localFilters.value,
    sorting: localSorting.value,
    columns: localColumns.value
  }
}

// ============ Aggregation Helpers ============

function addAggregation() {
  if (numberColumns.value.length > 0) {
    localTableAggregations.value.push({
      field: numberColumns.value[0].field,
      type: 'sum'
    })
  }
}

function removeAggregation(index: number) {
  localTableAggregations.value.splice(index, 1)
}

// ============ Action Handlers ============

function handleSave() {
  emit('save', buildSettings())
  drawerVisible.value = false
}

function handlePreview() {
  isPreviewing.value = true
  emit('preview', buildSettings())
}

function handleCancel() {
  emit('cancel')
  drawerVisible.value = false
}

function handleClose() {
  if (hasChanges.value) {
    // Could show confirmation dialog here
    emit('cancel')
  }
  drawerVisible.value = false
}

// Section collapse states
const sectionsCollapsed = ref({
  general: false,
  viewType: false,
  filters: false,
  sorting: false,
  columns: true
})

function toggleSection(section: keyof typeof sectionsCollapsed.value) {
  sectionsCollapsed.value[section] = !sectionsCollapsed.value[section]
}
</script>

<template>
  <el-drawer
    v-model="drawerVisible"
    title="View Settings"
    direction="rtl"
    size="380px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="handleClose"
  >
    <div class="settings-content">
      <!-- General Section (Name) -->
      <div class="settings-section">
        <div 
          class="section-header"
          @click="toggleSection('general')"
        >
          <span class="section-title">General</span>
          <span class="expand-icon">{{ sectionsCollapsed.general ? '▶' : '▼' }}</span>
        </div>
        
        <div v-if="!sectionsCollapsed.general" class="section-content">
          <label class="config-label">View Name</label>
          <el-input
            v-model="localName"
            placeholder="Enter view name"
            maxlength="100"
            show-word-limit
          />
        </div>
      </div>
      
      <!-- View Type Section -->
      <div class="settings-section">
        <div 
          class="section-header"
          @click="toggleSection('viewType')"
        >
          <span class="section-title">View Type</span>
          <span class="expand-icon">{{ sectionsCollapsed.viewType ? '▶' : '▼' }}</span>
        </div>
        
        <div v-if="!sectionsCollapsed.viewType" class="section-content">
          <el-select
            v-model="localViewType"
            placeholder="Select view type"
            class="full-width"
          >
            <el-option
              v-for="option in viewTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            >
              <div class="view-type-option">
                <span class="option-label">{{ option.label }}</span>
                <span class="option-desc">{{ option.description }}</span>
              </div>
            </el-option>
          </el-select>
          
          <!-- Table Config (Group By) -->
          <div v-if="localViewType === 'table'" class="view-config">
            <label class="config-label">Primary Group By (Level 1)</label>
            <el-select
              v-model="localTableGroupBy"
              placeholder="No grouping"
              clearable
              class="full-width"
            >
              <el-option
                v-for="col in groupByColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
            <p class="config-hint">
              Creates separate table sections for each group value. Supports single-select, user, checkbox, switch, and relation fields.
            </p>
            
            <label v-if="localTableGroupBy" class="config-label">Secondary Group By (Level 2)</label>
            <el-select
              v-if="localTableGroupBy"
              v-model="localTableGroupBySecondary"
              placeholder="No secondary grouping"
              clearable
              class="full-width"
            >
              <el-option
                v-for="col in groupByColumns.filter(c => c.field !== localTableGroupBy)"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
            <p v-if="localTableGroupBy" class="config-hint">
              Groups rows within each table section.
            </p>
            
            <!-- Aggregations (only for secondary grouping) -->
            <template v-if="localTableGroupBySecondary">
              <div class="aggregations-section">
                <label class="config-label">Aggregations (Optional)</label>
                <p class="config-hint">Calculate totals, averages, etc. for number fields in group headers.</p>
                
                <div v-for="(agg, index) in localTableAggregations" :key="index" class="aggregation-row">
                  <el-select
                    v-model="agg.field"
                    placeholder="Select field"
                    class="agg-field-select"
                  >
                    <el-option
                      v-for="col in numberColumns"
                      :key="col.field"
                      :label="col.title"
                      :value="col.field"
                    />
                  </el-select>
                  
                  <el-select
                    v-model="agg.type"
                    placeholder="Type"
                    class="agg-type-select"
                  >
                    <el-option label="Σ Sum" value="sum" />
                    <el-option label="⌀ Average" value="avg" />
                    <el-option label="Min" value="min" />
                    <el-option label="Max" value="max" />
                    <el-option label="# Count" value="count" />
                  </el-select>
                  
                  <el-button
                    :icon="Delete"
                    type="danger"
                    text
                    @click="removeAggregation(index)"
                  />
                </div>
                
                <el-button
                  :icon="Plus"
                  text
                  type="primary"
                  @click="addAggregation"
                  :disabled="numberColumns.length === 0"
                >
                  Add Aggregation
                </el-button>
                
                <p v-if="numberColumns.length === 0" class="config-hint warning">
                  No number fields available for aggregation.
                </p>
              </div>
            </template>
          </div>
          
          <!-- Kanban Config -->
          <div v-if="localViewType === 'kanban'" class="view-config">
            <label class="config-label">Group By Field *</label>
            <el-select
              v-model="localKanbanGroupBy"
              placeholder="Select a single-select field"
              class="full-width"
            >
              <el-option
                v-for="col in groupByColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
            <p v-if="groupByColumns.length === 0" class="config-hint warning">
              No single-select fields available. Add one to use Kanban view.
            </p>
          </div>
          
          <!-- Gantt Config -->
          <div v-if="localViewType === 'gantt'" class="view-config">
            <label class="config-label">Title Field *</label>
            <el-select
              v-model="localGanttTitleField"
              placeholder="Select title field"
              class="full-width"
            >
              <el-option
                v-for="col in textColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
            
            <label class="config-label">Start Date Field *</label>
            <el-select
              v-model="localGanttStartField"
              placeholder="Select start date"
              class="full-width"
            >
              <el-option
                v-for="col in dateColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
            
            <label class="config-label">End Date Field *</label>
            <el-select
              v-model="localGanttEndField"
              placeholder="Select end date"
              class="full-width"
            >
              <el-option
                v-for="col in dateColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
          </div>
          
          <!-- Calendar Config -->
          <div v-if="localViewType === 'calendar'" class="view-config">
            <label class="config-label">Date Field *</label>
            <el-select
              v-model="localCalendarDateField"
              placeholder="Select date field"
              class="full-width"
            >
              <el-option
                v-for="col in dateColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
          </div>
          
          <!-- Gallery Config -->
          <div v-if="localViewType === 'gallery'" class="view-config">
            <label class="config-label">Title Field *</label>
            <el-select
              v-model="localGalleryTitleField"
              placeholder="Select title field"
              class="full-width"
            >
              <el-option
                v-for="col in textColumns"
                :key="col.field"
                :label="col.title"
                :value="col.field"
              />
            </el-select>
          </div>
        </div>
      </div>
      
      <!-- Filters Section -->
      <div class="settings-section">
        <div 
          class="section-header"
          @click="toggleSection('filters')"
        >
          <span class="section-title">
            Filters
            <el-badge v-if="localFilters.length > 0" :value="localFilters.length" class="section-badge" />
          </span>
          <span class="expand-icon">{{ sectionsCollapsed.filters ? '▶' : '▼' }}</span>
        </div>
        
        <div v-if="!sectionsCollapsed.filters" class="section-content">
          <FilterBuilder
            :columns="allColumns"
            :filters="localFilters"
            @add="handleAddFilter"
            @update="handleUpdateFilter"
            @remove="handleRemoveFilter"
            @clear="handleClearFilters"
          />
        </div>
      </div>
      
      <!-- Sorting Section -->
      <div class="settings-section">
        <div 
          class="section-header"
          @click="toggleSection('sorting')"
        >
          <span class="section-title">
            Sorting
            <el-badge v-if="localSorting.length > 0" :value="localSorting.length" class="section-badge" />
          </span>
          <span class="expand-icon">{{ sectionsCollapsed.sorting ? '▶' : '▼' }}</span>
        </div>
        
        <div v-if="!sectionsCollapsed.sorting" class="section-content">
          <SortBuilder
            :columns="allColumns"
            :sorting="localSorting"
            @add="handleAddSort"
            @update="handleUpdateSort"
            @remove="handleRemoveSort"
            @clear="handleClearSorting"
          />
        </div>
      </div>
      
      <!-- Columns Section -->
      <div class="settings-section">
        <div 
          class="section-header"
          @click="toggleSection('columns')"
        >
          <span class="section-title">
            Columns
            <span class="column-count">
              ({{ localColumns.filter(c => c.visible).length }}/{{ localColumns.length }})
            </span>
          </span>
          <span class="expand-icon">{{ sectionsCollapsed.columns ? '▶' : '▼' }}</span>
        </div>
        
        <div v-if="!sectionsCollapsed.columns" class="section-content">
          <ColumnSelector
            :table="table"
            :visible-columns="localColumns"
            :related-tables="relatedTables"
            @toggle="handleToggleColumn"
            @add="handleAddColumn"
            @remove="handleRemoveColumn"
          />
        </div>
      </div>
    </div>
    
    <!-- Footer with action buttons -->
    <template #footer>
      <div class="drawer-footer">
        <div class="footer-left">
          <el-button 
            :icon="ViewIcon"
            @click="handlePreview"
            :disabled="!hasChanges"
          >
            Preview
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="handleCancel">
            Cancel
          </el-button>
          <el-button 
            type="primary" 
            @click="handleSave"
            :disabled="!localName.trim()"
          >
            Save
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<style lang="scss" scoped>
.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.settings-section {
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s) var(--app-space-m);
  background: var(--app-fill-color-light);
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: var(--app-fill-color);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-badge {
  :deep(.el-badge__content) {
    height: 16px;
    line-height: 16px;
    padding: 0 5px;
    font-size: 10px;
  }
}

.column-count {
  font-size: var(--app-font-size-xs);
  font-weight: 400;
  color: var(--app-text-color-placeholder);
}

.expand-icon {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
}

.section-content {
  padding: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
}

.full-width {
  width: 100%;
}

.view-type-option {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.option-label {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
}

.option-desc {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
}

.view-config {
  margin-top: var(--app-space-m);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.config-label {
  font-size: var(--app-font-size-s);
  font-weight: 500;
  color: var(--app-text-color-secondary);
  margin-top: var(--app-space-xs);
  
  &:first-child {
    margin-top: 0;
  }
}

.config-hint {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  margin: var(--app-space-xxs) 0 0 0;
  
  &.warning {
    color: var(--app-warning-color);
  }
}

.aggregations-section {
  margin-top: var(--app-space-m);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
}

.aggregation-row {
  display: flex;
  gap: var(--app-space-xs);
  align-items: center;
  margin-bottom: var(--app-space-xs);
  
  .agg-field-select {
    flex: 2;
  }
  
  .agg-type-select {
    flex: 1;
  }
}

.drawer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--app-border-color);
}

.footer-left {
  display: flex;
  gap: var(--app-space-xs);
}

.footer-right {
  display: flex;
  gap: var(--app-space-xs);
}
</style>
