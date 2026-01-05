<script lang="ts" setup>
import type { 
  Database, 
  Table, 
  View, 
  ViewType, 
  VisibleColumn, 
  FilterCondition, 
  SortConfig,
  RelatedTableInfo,
  Column
} from '../../types/database'
import { Filter, Sort, Grid, List } from '@element-plus/icons-vue'
import FilterBuilder from './FilterBuilder.vue'
import SortBuilder from './SortBuilder.vue'
import ColumnSelector from './ColumnSelector.vue'

const props = defineProps<{
  database: Database
  table: Table
  view: View
  visibleColumns: VisibleColumn[]
  filters: FilterCondition[]
  sorting: SortConfig[]
  relatedTables: RelatedTableInfo[]
}>()

const emit = defineEmits<{
  'update:viewType': [type: ViewType]
  addFilter: [filter: FilterCondition]
  updateFilter: [index: number, filter: FilterCondition]
  removeFilter: [index: number]
  clearFilters: []
  addSort: [sort: SortConfig]
  updateSort: [index: number, sort: SortConfig]
  removeSort: [index: number]
  clearSorting: []
  toggleColumn: [columnId: string, visible?: boolean]
  addColumn: [column: Omit<VisibleColumn, 'id' | 'order'>]
  removeColumn: [columnId: string]
}>()

// Popover visibility states
const showFilterPopover = ref(false)
const showSortPopover = ref(false)
const showColumnPopover = ref(false)

// View type options
const viewTypeOptions: { value: ViewType; label: string; icon: string }[] = [
  { value: 'table', label: 'Table', icon: '📋' },
  { value: 'kanban', label: 'Kanban', icon: '📌' },
  { value: 'gantt', label: 'Gantt', icon: '📊' },
  { value: 'calendar', label: 'Calendar', icon: '📅' },
  { value: 'gallery', label: 'Gallery', icon: '🖼️' }
]

// Get current view type label
const currentViewTypeLabel = computed(() => {
  const option = viewTypeOptions.find(o => o.value === props.view.type)
  return option ? `${option.icon} ${option.label}` : 'Table'
})

// Handle view type change
function handleViewTypeChange(type: ViewType) {
  emit('update:viewType', type)
}

// Get all available columns for filtering/sorting
const allColumns = computed((): Column[] => {
  return props.table.columns
})

// Active filter count
const activeFilterCount = computed(() => props.filters.length)

// Active sort count
const activeSortCount = computed(() => props.sorting.length)

// Visible column count
const visibleColumnCount = computed(() => 
  props.visibleColumns.filter(c => c.visible).length
)
const totalColumnCount = computed(() => props.visibleColumns.length)
</script>

<template>
  <div class="view-toolbar">
    <div class="toolbar-left">
      <!-- View Type Switcher -->
      <el-dropdown trigger="click" @command="handleViewTypeChange">
        <el-button class="view-type-btn">
          {{ currentViewTypeLabel }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="option in viewTypeOptions"
              :key="option.value"
              :command="option.value"
              :class="{ active: view.type === option.value }"
            >
              <span class="type-icon">{{ option.icon }}</span>
              {{ option.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-divider direction="vertical" />
      
      <!-- Filter Button -->
      <el-popover
        v-model:visible="showFilterPopover"
        placement="bottom-start"
        :width="480"
        trigger="click"
      >
        <template #reference>
          <el-button :type="activeFilterCount > 0 ? 'primary' : 'default'" text>
            <el-icon><Filter /></el-icon>
            <span>Filter</span>
            <el-badge
              v-if="activeFilterCount > 0"
              :value="activeFilterCount"
              class="filter-badge"
            />
          </el-button>
        </template>
        <FilterBuilder
          :columns="allColumns"
          :filters="filters"
          @add="(filter) => emit('addFilter', filter)"
          @update="(index, filter) => emit('updateFilter', index, filter)"
          @remove="(index) => emit('removeFilter', index)"
          @clear="() => emit('clearFilters')"
        />
      </el-popover>
      
      <!-- Sort Button -->
      <el-popover
        v-model:visible="showSortPopover"
        placement="bottom-start"
        :width="400"
        trigger="click"
      >
        <template #reference>
          <el-button :type="activeSortCount > 0 ? 'primary' : 'default'" text>
            <el-icon><Sort /></el-icon>
            <span>Sort</span>
            <el-badge
              v-if="activeSortCount > 0"
              :value="activeSortCount"
              class="sort-badge"
            />
          </el-button>
        </template>
        <SortBuilder
          :columns="allColumns"
          :sorting="sorting"
          @add="(sort) => emit('addSort', sort)"
          @update="(index, sort) => emit('updateSort', index, sort)"
          @remove="(index) => emit('removeSort', index)"
          @clear="() => emit('clearSorting')"
        />
      </el-popover>
      
      <!-- Columns Button -->
      <el-popover
        v-model:visible="showColumnPopover"
        placement="bottom-start"
        :width="360"
        trigger="click"
      >
        <template #reference>
          <el-button text>
            <el-icon><Grid /></el-icon>
            <span>Columns</span>
            <span class="column-count">({{ visibleColumnCount }}/{{ totalColumnCount }})</span>
          </el-button>
        </template>
        <ColumnSelector
          :table="table"
          :visible-columns="visibleColumns"
          :related-tables="relatedTables"
          @toggle="(columnId, visible) => emit('toggleColumn', columnId, visible)"
          @add="(column) => emit('addColumn', column)"
          @remove="(columnId) => emit('removeColumn', columnId)"
        />
      </el-popover>
    </div>
    
    <div class="toolbar-right">
      <!-- Active filters display -->
      <div v-if="activeFilterCount > 0" class="active-filters">
        <el-tag
          v-for="(filter, index) in filters.slice(0, 3)"
          :key="index"
          size="small"
          closable
          @close="emit('removeFilter', index)"
        >
          {{ filter.field }} {{ filter.operator }} {{ filter.value }}
        </el-tag>
        <el-tag v-if="filters.length > 3" size="small" type="info">
          +{{ filters.length - 3 }} more
        </el-tag>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.view-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s) var(--app-space-l);
  background: var(--app-paper);
  border-bottom: 1px solid var(--app-border-color);
  gap: var(--app-space-m);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.view-type-btn {
  min-width: 120px;
  justify-content: space-between;
}

.type-icon {
  margin-right: var(--app-space-xs);
}

:deep(.el-dropdown-menu__item) {
  &.active {
    color: var(--app-primary-color);
    background: var(--app-primary-alpha-10);
  }
}

.filter-badge,
.sort-badge {
  margin-left: var(--app-space-xs);
  
  :deep(.el-badge__content) {
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
    font-size: 10px;
  }
}

.column-count {
  margin-left: var(--app-space-xxs);
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-xs);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.active-filters {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  flex-wrap: wrap;
}

.el-divider--vertical {
  height: 20px;
  margin: 0 var(--app-space-xs);
}
</style>

