<script setup lang="ts" generic="T extends Record<string, any>">
import { useDebounceFn } from '@vueuse/core'
import { ElMessage } from 'element-plus'

interface FilterSchema<T = any> {
  key: keyof T
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'date'
  options?: Array<{ label: string; value: any }>
  placeholder?: string
}

interface Props {
  data: T[]
  schema?: FilterSchema<T>[]
  zodSchema?: any // z.ZodObject<any>
  searchKeys?: (keyof T)[]
  excludeKeys?: (keyof T)[]
  customLabels?: Partial<Record<keyof T, string>>
  defaultSortBy?: keyof T
  defaultSortOrder?: 'asc' | 'desc'
  containerClass?: string
  debounceMs?: number
}

const props = withDefaults(defineProps<Props>(), {
  searchKeys: () => [],
  excludeKeys: () => [],
  customLabels: () => ({}) as Partial<Record<keyof T, string>>,
  defaultSortOrder: () => 'asc',
  debounceMs: 300
})

const emit = defineEmits<{
  selected: [item: T]
  filtered: [filteredItems: T[]]
}>()

// Refs
const sortPopover = ref()

// State management
const keyword = ref<string>('')
const filterOptions = ref<{ [key in keyof T]?: any }>({})
const tempFilterOptions = ref<{ [key in keyof T]?: any }>({})
const isFilterStage = ref<boolean>(false)
const sortBy = ref<keyof T | undefined>(props.defaultSortBy)
const sortOrder = ref<'asc' | 'desc'>(props.defaultSortOrder)

// Filtered list as a shallow ref instead of computed
const filteredList = shallowRef<T[]>(props.data)

// Optional external search handler (e.g., for database search)
// Should return filtered results (with __dim if isFilterStage=true)
const onSearchParamsChange = inject<((params: any) => Promise<T[]> | T[] | void) | null>('onSearchParamsChange', null)

// Check if filters are applied
const hasAppliedFilters = computed(() => {
  return Object.keys(filterOptions.value || {}).length > 0
})

// Auto-generate schema from Zod if provided
const finalSchema = computed(() => {
  if (props.schema) {
    return props.schema
  }

  if (props.zodSchema) {
    return generateSchemaFromZod(props.zodSchema)
  }

  return []
})

// Generate filter schema from Zod schema
function generateSchemaFromZod(zodSchema: any): FilterSchema<T>[] {
  const shape = zodSchema.shape
  const filters: FilterSchema<T>[] = []

  // System field patterns to exclude
  const systemFieldPatterns = [
    'id',
    'Id',
    'token',
    'Token',
    'createdAt',
    'updatedAt',
    'created_at',
    'updated_at',
    'createdBy',
    'created_by',
    'updatedBy',
    'updated_by',
    'deletedAt',
    'deleted_at',
    '__dim'
  ]

  for (const [key, zodType] of Object.entries(shape)) {
    if (props.excludeKeys.includes(key as keyof T)) continue

    // Skip system fields
    const isSystemField = systemFieldPatterns.some(
      (pattern) => key === pattern || key.toLowerCase().includes(pattern.toLowerCase()) || key.endsWith('At') || key.endsWith('By')
    )

    if (isSystemField) continue

    const typeName = (zodType as any)._def?.typeName
    const label = props.customLabels[key as keyof T] || formatLabel(key)

    let filterType: 'select' | 'boolean' | null = null
    let options: Array<{ label: string; value: any }> | undefined

    // Only include boolean and select filters
    if (typeName === 'ZodBoolean') {
      filterType = 'boolean'
    } else if (typeName === 'ZodEnum') {
      filterType = 'select'
      const enumValues = (zodType as any)._def?.values || []
      options = enumValues.map((val: string) => ({
        label: formatLabel(val),
        value: val
      }))
    }

    // Skip if not boolean or select
    if (!filterType) continue

    filters.push({
      key: key as keyof T,
      label,
      type: filterType,
      options,
      placeholder: generatePlaceholder(label, filterType)
    })
  }

  return filters
}

// Format key into readable label
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim()
}

// Generate placeholder text
function generatePlaceholder(label: string, type: string): string {
  switch (type) {
    case 'text':
      return `Search ${label.toLowerCase()}...`
    case 'select':
      return `Select ${label.toLowerCase()}`
    case 'number':
      return `Filter by ${label.toLowerCase()}`
    case 'date':
      return `Filter by ${label.toLowerCase()}`
    default:
      return ''
  }
}

// Helper function to check if an item matches all filters
function defaultItemMatchesFilters(item: T, filters: { [key in keyof T]?: any }, keywordValue: string): boolean {
  // Check filter options
  if (filters && Object.keys(filters).length > 0) {
    const matchesFilterOptions = Object.entries(filters).every(([key, value]) => {
      // Skip if filter value is undefined or null
      if (value === undefined || value === null) return true

      const itemValue = item[key as keyof T]

      // Handle boolean filter
      if (typeof value === 'boolean') {
        return itemValue === value
      }

      // Handle string filter
      if (typeof value === 'string') {
        if (!value) return true // Empty string means no filter
        return String(itemValue).toLowerCase().includes(value.toLowerCase())
      }

      // Handle array filter (item value must match one of the array values)
      if (Array.isArray(value)) {
        if (value.length === 0) return true // Empty array means no filter
        return value.includes(itemValue)
      }

      return true
    })

    if (!matchesFilterOptions) return false
  }

  // Check keyword search
  if (keywordValue) {
    // Split keyword by spaces and filter out empty strings
    const keywords = keywordValue
      .trim()
      .split(/\s+/)
      .filter((k) => k.length > 0)

    if (keywords.length === 0) return true

    const keysToSearch = props.searchKeys.length > 0 ? props.searchKeys : Object.keys(item)

    // Check if ANY keyword matches ANY searchable field
    const matchesKeyword = keywords.some((keyword) => {
      const searchTerm = keyword.toLowerCase()
      return keysToSearch.some((key) => {
        const value = item[key as keyof T]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm)
        }
        return false
      })
    })

    if (!matchesKeyword) return false
  }

  return true
}

/**
 * Compute filtered and sorted list
 * This is called by the debounced watcher
 */
async function computeFilteredList() {
  const startTime = performance.now()

  const filters = isFilterStage.value ? tempFilterOptions.value : filterOptions.value
  const keywordValue = keyword.value

  let filterType = 'None'

  // If external search handler is provided (e.g., database search)
  if (onSearchParamsChange) {
    filterType = 'Database'
    const result = await onSearchParamsChange({
      keyword: keywordValue,
      filters,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      isFilterStage: isFilterStage.value
    })


  }

  // Default client-side filtering
  filterType = 'Client-side'
  const hasActiveFilters = keywordValue || Object.keys(tempFilterOptions.value).length > 0

  let result: T[]

  if (!hasActiveFilters) {
    result = props.data
    filterType = 'None'
  } else if (isFilterStage.value) {
    // During filter stage (typing/selecting), show all items with __dim
    result = props.data.map((item) => {
      const matches = defaultItemMatchesFilters(item, tempFilterOptions.value, keywordValue)
      return {
        ...item,
        __dim: !matches
      }
    })
  } else {
    // After confirmation, filter the list
    result = props.data.filter((item) => defaultItemMatchesFilters(item, filterOptions.value, keywordValue))
  }

  // Sort the results
  filteredList.value = sortItems(result)
  const endTime = performance.now()
  const duration = (endTime - startTime).toFixed(2)

}

// Sort items: non-dimmed first, then dimmed, then by sortBy field
function sortItems(items: T[]): T[] {
  const sorted = [...items]

  sorted.sort((a: any, b: any) => {
    // First priority: non-dimmed items come before dimmed items
    const aDim = a.__dim || false
    const bDim = b.__dim || false

    if (aDim !== bDim) {
      return aDim ? 1 : -1
    }

    // Second priority: sort by specified field
    if (sortBy.value) {
      const aVal = a[sortBy.value]
      const bVal = b[sortBy.value]

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      // Compare values
      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime()
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }

      return sortOrder.value === 'asc' ? comparison : -comparison
    }

    return 0
  })

  return sorted
}

// Get sortable fields from schema
const sortableFields = computed(() => {
  if (!props.data || props.data.length === 0) return []

  const firstItem = props.data[0]
  const fields = Object.keys(firstItem).filter((key) => {
    // Exclude system fields and __dim
    if (key === '__dim' || key === 'id') return false
    if (key.endsWith('At') || key.endsWith('By') || key.includes('Token')) return false

    const value = firstItem[key as keyof T]
    // Include string, number, date fields
    const valueType = typeof value
    return valueType === 'string' || valueType === 'number' || (value != null && typeof (value as any).getTime === 'function')
  })

  return fields as (keyof T)[]
})

// Toggle sort order or change sort field
function handleSortChange(field: keyof T) {
  if (sortBy.value === field) {
    // Toggle order
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Change field
    sortBy.value = field
    sortOrder.value = 'asc'
  }
  sortPopover.value?.close()
}

// Open sort popover
function handleSortClick(event: MouseEvent) {
  sortPopover.value?.open(event.currentTarget)
}

// Debounced function to update filtered list
const debouncedComputeFilteredList = useDebounceFn(async () => {
  await computeFilteredList()
}, props.debounceMs)

// Handle filter input changes
function handleFilterChange(key: keyof T, value: any) {
  isFilterStage.value = true
  tempFilterOptions.value = {
    ...tempFilterOptions.value,
    [key]: value
  }
  debouncedComputeFilteredList()
}

// Handle keyword input
function handleKeywordInput() {
  isFilterStage.value = true
  debouncedComputeFilteredList()
}

// Handle confirmation (Enter or explicit confirm)
async function handleConfirm() {
  // Apply the filters first
  filterOptions.value = { ...tempFilterOptions.value }
  isFilterStage.value = false

  // Immediately compute filtered list
  await computeFilteredList()

  // Count matching items
  const matchingItems = filteredList.value.filter((item: any) => !item.__dim)

  // If only one item matches, emit selected event (but keep filters)
  if (matchingItems.length === 1) {
    emit('selected', matchingItems[0])
  }
}

// Handle Enter key press
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    handleConfirm()
  } else if (event.key === 'Escape') {
    handleEscapeKey()
  }
}

// Handle ESC key press
function handleEscapeKey() {
  if (isFilterStage.value) {
    // If in filter stage, cancel and revert to previous filters
    tempFilterOptions.value = { ...filterOptions.value }
    isFilterStage.value = false
  } else if (keyword.value || Object.keys(filterOptions.value).length > 0) {
    // If filters are applied, reset all filters
    resetFilters()
  }
}

// Reset filters
async function resetFilters() {
  keyword.value = ''
  filterOptions.value = {}
  tempFilterOptions.value = {}
  isFilterStage.value = false
  await computeFilteredList()
}

// Watch for changes in data, keyword, filters, and sorting
watch(
  [() => props.data, keyword, tempFilterOptions, sortBy, sortOrder],
  () => {
    const hasFilters = keyword.value || Object.keys(tempFilterOptions.value).length > 0
    if (!hasFilters) {
      isFilterStage.value = false
      filterOptions.value = {}
    }
    debouncedComputeFilteredList()
  },
  { deep: true }
)

// Initial computation
onMounted(async () => {
  await computeFilteredList()
})

// Global ESC key listener
onMounted(() => {
  document.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeydown)
})

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Check if user is typing in an input
    const activeElement = document.activeElement as HTMLElement
    const isTyping = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || activeElement?.isContentEditable

    // If not typing, handle escape
    if (!isTyping) {
      handleEscapeKey()
    }
  }
}
</script>

<template>
  <div class="searchable-list">
    <div :class="{ 'filter-container': true, 'is-filtering': isFilterStage || keyword || hasAppliedFilters }">
      <!-- Keyword Search -->
      <ElInput v-model="keyword" placeholder="Search..." clearable @input="handleKeywordInput" @keydown="handleKeydown" class="search-input">
        <template #prefix>
          <Icon name="mdi:magnify" />
        </template>
      </ElInput>

      <!-- Sort Controls -->
      <div v-if="sortableFields.length > 0" class="sort-controls">
        <div class="sort-trigger" @click="handleSortClick">
          <span class="sort-field-name">
            {{ sortBy ? props.customLabels[sortBy as keyof typeof props.customLabels] || formatLabel(String(sortBy)) : 'Sort' }}
          </span>
          <Icon :name="sortOrder === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'" class="sort-icon" />
        </div>
      </div>

      <UiPopoverDialog ref="sortPopover" title="Sort Options" width="280px" placement="bottom-start">
        <div class="sort-options">
          <div class="sort-section">
            <div class="section-label">Sort by</div>
            <div class="sort-fields">
              <div
                v-for="field in sortableFields"
                :key="String(field)"
                :class="['sort-field-item', { active: sortBy === field }]"
                @click="handleSortChange(field)"
              >
                {{ props.customLabels[field] || formatLabel(String(field)) }}
              </div>
            </div>
          </div>

          <div class="sort-section">
            <div class="section-label">Order</div>
            <div class="sort-order-toggle">
              <div :class="['order-option', { active: sortOrder === 'asc' }]" @click="sortOrder = 'asc'">
                <Icon name="mdi:sort-ascending" />
                <span>Ascending</span>
              </div>
              <div :class="['order-option', { active: sortOrder === 'desc' }]" @click="sortOrder = 'desc'">
                <Icon name="mdi:sort-descending" />
                <span>Descending</span>
              </div>
            </div>
          </div>
        </div>
      </UiPopoverDialog>

      <!-- Auto-generated Filters -->
      <div v-if="finalSchema.length > 0" class="filters">
        <template v-for="filter in finalSchema" :key="String(filter.key)">
          <!-- Text Filter -->
          <ElInput
            v-if="filter.type === 'text'"
            :model-value="(tempFilterOptions as any)[filter.key]"
            :placeholder="filter.placeholder || filter.label"
            clearable
            @update:model-value="(val: any) => handleFilterChange(filter.key, val)"
            @keydown="handleKeydown"
          >
            <template #prepend>{{ filter.label }}</template>
          </ElInput>

          <!-- Select Filter -->
          <ElSelect
            v-else-if="filter.type === 'select'"
            :model-value="(tempFilterOptions as any)[filter.key]"
            :placeholder="filter.placeholder || `Select ${filter.label}`"
            clearable
            @update:model-value="(val: any) => handleFilterChange(filter.key, val)"
            @keydown="handleKeydown"
          >
            <template #prefix>{{ filter.label }}:</template>
            <ElOption v-for="option in filter.options" :key="String(option.value)" :label="option.label" :value="option.value" />
          </ElSelect>

          <!-- Boolean Filter -->
          <ElCheckbox
            v-else-if="filter.type === 'boolean'"
            :model-value="(tempFilterOptions as any)[filter.key]"
            @update:model-value="(val: any) => handleFilterChange(filter.key, val)"
          >
            {{ filter.label }}
          </ElCheckbox>
        </template>
      </div>
      <!-- Action slot -->
      <slot name="actions" />
      <!-- Action Buttons -->
      <div v-if="isFilterStage || keyword || hasAppliedFilters" class="filter-actions">
        <div v-if="isFilterStage" class="filter-action-button cancel">
          <Icon name="mdi:close" @click="handleEscapeKey" />
        </div>
        <div v-if="isFilterStage" class="filter-action-button confirm">
          <Icon name="mdi:check" @click="handleConfirm" />
        </div>
        <div v-if="!isFilterStage && (keyword || hasAppliedFilters)" class="filter-action-button reset">
          <Icon name="mdi:filter-off" @click="resetFilters" />
        </div>
      </div>
    </div>
    <template v-if="filteredList.length === 0">
      <template v-if="$slots.noData">
        <slot name="noData"></slot>
      </template>
      <template v-else>
        <div class="no-data">
          <div class="noDataContent">
            <Icon name="mdi:magnify" />
            <span>No data</span>
          </div>
        </div>
      </template>
    </template>
    <div :class="['list-content', ...(props.containerClass?.split(',') || [])]">
      <slot :items="filteredList" :is-filtering="isFilterStage" :keyword="keyword" :filters="isFilterStage ? tempFilterOptions : filterOptions" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.no-data {
  width: 100%;
  height: 100%;
  font-size: var(--app-font-size-xl);
  display: grid;
  place-items: center;
}
.searchable-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
}

.filter-container {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
  gap: var(--app-space-xs);
  position: relative;
  @container (max-width: 600px) {
    flex-flow: row wrap;
  }
  &.is-filtering {
    padding-right: var(--app-space-l);
  }
}

.search-input {
  flex: 1 0 auto;
  width: auto;
}

.sort-controls {
  display: flex;
}

.sort-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  background-color: var(--app-grey-950);
  border: 1px solid var(--app-grey-700);
  border-radius: var(--app-border-radius-m);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--app-font-size-s);
  // height: 38px;
  &:hover {
    background-color: var(--app-grey-700);
    border-color: var(--app-primary-alpha-50);
  }

  .sort-field-name {
    font-weight: 500;
    color: var(--app-text-primary);
  }

  .sort-icon {
    color: var(--app-primary);
    font-size: var(--app-font-size-m);
  }
}

.sort-options {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.sort-section {
  .section-label {
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-300);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--app-space-xs);
  }
}

.sort-fields {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xxs);
}

.sort-field-item {
  padding: var(--app-space-xs) var(--app-space-s);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--app-font-size-s);

  &:hover {
    background-color: var(--app-grey-800);
  }

  &.active {
    background-color: var(--app-primary-color);
    color: var(--app-paper);
    font-weight: 500;
  }
}

.sort-order-toggle {
  display: flex;
  gap: var(--app-space-xs);
}

.order-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-s);
  border: 1px solid var(--app-grey-700);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--app-font-size-s);

  &:hover {
    background-color: var(--app-grey-800);
    border-color: var(--app-primary-alpha-50);
  }

  &.active {
    background-color: var(--app-primary-alpha-10);
    border-color: var(--app-primary);
    color: var(--app-primary);
    font-weight: 500;
  }

  .icon {
    font-size: var(--app-font-size-m);
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-s);
  align-items: center;
}

.filter-actions {
  position: absolute;
  right: 0;
  top: 8px;
  display: flex;
  flex-flow: row nowrap;
  gap: 0;
  justify-content: flex-end;
}
.filter-action-button {
  font-size: var(--app-font-size-s);
  padding: var(--app-space-xxs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: all 0.2s ease;
  &.cancel {
    color: var(--app-error-color);
  }
  &.confirm {
    color: var(--app-success-color);
  }
  &.reset {
    color: var(--app-warning-color);
  }
  &:hover {
    background-color: var(--app-grey-800);
  }
}
.list-content {
  flex: 1;
  overflow: auto;
}
</style>
