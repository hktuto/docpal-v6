<script lang="ts" setup>
import type { Table, VisibleColumn, RelatedTableInfo, Column } from '../../types/database'
import { Search, Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  table: Table
  visibleColumns: VisibleColumn[]
  relatedTables: RelatedTableInfo[]
}>()

const emit = defineEmits<{
  toggle: [columnId: string, visible?: boolean]
  add: [column: Omit<VisibleColumn, 'id' | 'order'>]
  remove: [columnId: string]
}>()

// Search query
const searchQuery = ref('')

// Collapsed sections
const collapsedSections = ref<Record<string, boolean>>({})

// Toggle section collapse
function toggleSection(sectionId: string) {
  collapsedSections.value[sectionId] = !collapsedSections.value[sectionId]
}

// Check if a base column is visible
function isBaseColumnVisible(column: Column): boolean {
  const vc = props.visibleColumns.find(
    c => c.sourceType === 'base' && (c.columnId === column.id || c.field === column.field)
  )
  return vc?.visible ?? true
}

// Check if a related column is added
function isRelatedColumnAdded(relationField: string, column: Column): boolean {
  return props.visibleColumns.some(
    c => c.sourceType === 'relation' && 
         c.relationField === relationField && 
         (c.columnId === column.id || c.field === column.field)
  )
}

// Get related column visible state
function isRelatedColumnVisible(relationField: string, column: Column): boolean {
  const vc = props.visibleColumns.find(
    c => c.sourceType === 'relation' && 
         c.relationField === relationField && 
         (c.columnId === column.id || c.field === column.field)
  )
  return vc?.visible ?? false
}

// Toggle base column visibility
function handleToggleBaseColumn(column: Column) {
  const vc = props.visibleColumns.find(
    c => c.sourceType === 'base' && (c.columnId === column.id || c.field === column.field)
  )
  if (vc) {
    emit('toggle', vc.id, !vc.visible)
  }
}

// Toggle related column
function handleToggleRelatedColumn(relationField: string, relatedTableId: string, column: Column) {
  const existing = props.visibleColumns.find(
    c => c.sourceType === 'relation' && 
         c.relationField === relationField && 
         (c.columnId === column.id || c.field === column.field)
  )
  
  if (existing) {
    // Toggle visibility
    emit('toggle', existing.id, !existing.visible)
  } else {
    // Add new related column
    emit('add', {
      columnId: column.id,
      field: column.field,
      sourceTableId: relatedTableId,
      sourceType: 'relation',
      relationField,
      displayTitle: `${relationField} → ${column.title}`,
      visible: true,
      width: column.width
    })
  }
}

// Filter columns by search query
function filterColumns(columns: Column[]): Column[] {
  if (!searchQuery.value) return columns
  const query = searchQuery.value.toLowerCase()
  return columns.filter(c => 
    c.title.toLowerCase().includes(query) || 
    c.field.toLowerCase().includes(query)
  )
}

// Filtered base columns
const filteredBaseColumns = computed(() => filterColumns(props.table.columns))

// Filtered related tables with their filtered columns
const filteredRelatedTables = computed(() => {
  return props.relatedTables.map(rt => ({
    ...rt,
    columns: filterColumns(rt.columns)
  })).filter(rt => rt.columns.length > 0)
})

// Show all columns
function handleShowAll() {
  props.visibleColumns.forEach(vc => {
    if (!vc.visible) {
      emit('toggle', vc.id, true)
    }
  })
}

// Hide all columns (except first one)
function handleHideAll() {
  props.visibleColumns.forEach((vc, index) => {
    if (index > 0 && vc.visible) {
      emit('toggle', vc.id, false)
    }
  })
}

// Get column type icon
function getColumnTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    'text': '📝',
    'textarea': '📄',
    'number': '#',
    'date': '📅',
    'single-select': '☰',
    'multi-select': '☷',
    'checkbox': '☑',
    'switch': '⚡',
    'attachment': '📎',
    'rating': '⭐',
    'url': '🔗',
    'email': '✉️',
    'user': '👤',
    'relation': '🔗',
    'fx': '🔣',
    'rollup': '∑'
  }
  return icons[type] || '📝'
}
</script>

<template>
  <div class="column-selector">
    <!-- Search -->
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="Search columns..."
        :prefix-icon="Search"
        size="small"
        clearable
      />
    </div>
    
    <!-- Quick actions -->
    <div class="quick-actions">
      <el-button text size="small" @click="handleShowAll">Show all</el-button>
      <el-button text size="small" @click="handleHideAll">Hide all</el-button>
    </div>
    
    <!-- Base table columns -->
    <div class="column-section">
      <div
        class="section-header"
        @click="toggleSection('base')"
      >
        <span class="expand-icon">{{ collapsedSections['base'] ? '▶' : '▼' }}</span>
        <span class="section-icon">📋</span>
        <span class="section-title">{{ table.name }}</span>
        <span class="column-count">({{ filteredBaseColumns.length }})</span>
      </div>
      
      <div v-if="!collapsedSections['base']" class="column-list">
        <div
          v-for="column in filteredBaseColumns"
          :key="column.id"
          class="column-item"
          @click="handleToggleBaseColumn(column)"
        >
          <el-checkbox
            :model-value="isBaseColumnVisible(column)"
            @click.stop
            @change="handleToggleBaseColumn(column)"
          />
          <span class="column-type-icon">{{ getColumnTypeIcon(column.type) }}</span>
          <span class="column-name">{{ column.title }}</span>
        </div>
      </div>
    </div>
    
    <!-- Related table columns -->
    <div
      v-for="relatedTable in filteredRelatedTables"
      :key="relatedTable.relationField"
      class="column-section"
    >
      <div
        class="section-header related"
        @click="toggleSection(relatedTable.relationField)"
      >
        <span class="expand-icon">{{ collapsedSections[relatedTable.relationField] ? '▶' : '▼' }}</span>
        <span class="section-icon">🔗</span>
        <span class="section-title">{{ relatedTable.relatedTableName }}</span>
        <span class="relation-badge">via {{ relatedTable.relationColumn.title }}</span>
        <span class="column-count">({{ relatedTable.columns.length }})</span>
      </div>
      
      <div v-if="!collapsedSections[relatedTable.relationField]" class="column-list">
        <div
          v-for="column in relatedTable.columns"
          :key="`${relatedTable.relationField}-${column.id}`"
          class="column-item related-column"
          @click="handleToggleRelatedColumn(relatedTable.relationField, relatedTable.relatedTableId, column)"
        >
          <el-checkbox
            :model-value="isRelatedColumnVisible(relatedTable.relationField, column)"
            @click.stop
            @change="handleToggleRelatedColumn(relatedTable.relationField, relatedTable.relatedTableId, column)"
          />
          <span class="column-type-icon">{{ getColumnTypeIcon(column.type) }}</span>
          <span class="column-name">{{ column.title }}</span>
          <el-tag
            v-if="!isRelatedColumnAdded(relatedTable.relationField, column)"
            size="small"
            type="info"
            class="add-tag"
          >
            + Add
          </el-tag>
        </div>
      </div>
    </div>
    
    <!-- Empty state -->
    <div v-if="filteredBaseColumns.length === 0 && filteredRelatedTables.length === 0" class="empty-state">
      <p>No columns match your search</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.column-selector {
  max-height: 300px;
  overflow-y: auto;
}

.search-box {
  padding: var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);
  position: sticky;
  top: 0;
  background: var(--app-paper);
  z-index: 1;
}

.quick-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-xs);
  padding: var(--app-space-xxs) var(--app-space-xs);
  border-bottom: 1px solid var(--app-border-color);
}

.column-section {
  border-bottom: 1px solid var(--app-border-color);
  
  &:last-child {
    border-bottom: none;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  cursor: pointer;
  background: var(--app-fill-color-light);
  transition: background 0.15s ease;
  
  &:hover {
    background: var(--app-fill-color);
  }
  
  &.related {
    background: var(--app-primary-alpha-5);
  }
}

.expand-icon {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  width: 12px;
}

.section-icon {
  font-size: var(--app-font-size-m);
}

.section-title {
  font-size: var(--app-font-size-s);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.relation-badge {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  font-style: italic;
}

.column-count {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
  margin-left: auto;
}

.column-list {
  padding: var(--app-space-xxs) 0;
}

.column-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xxs) var(--app-space-s);
  padding-left: calc(var(--app-space-s) + 12px + var(--app-space-xs));
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: var(--app-fill-color);
  }
  
  &.related-column {
    padding-left: calc(var(--app-space-s) + 12px + var(--app-space-xs) + 8px);
  }
}

.column-type-icon {
  font-size: var(--app-font-size-s);
  width: 18px;
  text-align: center;
}

.column-name {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-primary);
  flex: 1;
}

.add-tag {
  margin-left: auto;
  font-size: 10px;
}

.empty-state {
  padding: var(--app-space-l);
  text-align: center;
  color: var(--app-text-color-placeholder);
  
  p {
    margin: 0;
  }
}
</style>

