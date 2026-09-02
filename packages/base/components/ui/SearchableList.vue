<script setup lang="ts" generic="T extends Record<string, any>">
import { useSearchableList, type SearchableFilterSchema } from '../../composables/useSearchableList'

const props = withDefaults(
  defineProps<{
    data: T[]
    schema?: SearchableFilterSchema<T>[]
    zodSchema?: any
    searchKeys?: (keyof T)[]
    excludeKeys?: (keyof T)[]
    customLabels?: Partial<Record<keyof T, string>>
    defaultSortBy?: keyof T
    defaultSortOrder?: 'asc' | 'desc'
    containerClass?: string
  }>(),
  {
    searchKeys: () => [],
    excludeKeys: () => [],
    customLabels: () => ({}) as Partial<Record<keyof T, string>>,
    defaultSortOrder: 'asc'
  }
)

const emit = defineEmits<{
  selected: [item: T]
  filtered: [filteredItems: T[]]
  sortChange: [{ sortBy: keyof T | undefined; sortOrder: 'asc' | 'desc' }]
}>()

const {
  sortPopover,
  keyword,
  filterOptions,
  tempFilterOptions,
  isFilterStage,
  sortBy,
  sortOrder,
  hasAppliedFilters,
  filteredList,
  finalSchema,
  sortableFields,
  getFieldLabel,
  handleSortChange,
  handleToggleSortOrder,
  handleSortClick,
  handleFilterChange,
  handleKeywordInput,
  handleConfirm,
  handleEscapeKey,
  handleKeydown,
  resetFilters
} = useSearchableList(props, emit)
</script>

<template>
  <div class="searchable-list">
    <div :class="{ 'filter-container': true, 'is-filtering': isFilterStage || keyword || hasAppliedFilters }">
      <ElInput v-model="keyword" placeholder="Search..." clearable class="search-input" @input="handleKeywordInput" @keydown="handleKeydown">
        <template #prefix>
          <Icon name="mdi:magnify" />
        </template>
      </ElInput>

      <div v-if="sortableFields.length > 0" class="sort-controls">
        <div class="sort-trigger" @click="handleToggleSortOrder">
          <span class="sort-field-name" @click="handleSortClick">{{ getFieldLabel(sortBy) }}</span>
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
                {{ getFieldLabel(field) }}
              </div>
            </div>
          </div>
        </div>
      </UiPopoverDialog>

      <div v-if="finalSchema.length > 0" class="filters">
        <template v-for="filter in finalSchema" :key="String(filter.key)">
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
          <ElCheckbox
            v-else-if="filter.type === 'boolean'"
            :model-value="(tempFilterOptions as any)[filter.key]"
            @update:model-value="(val: any) => handleFilterChange(filter.key, val)"
          >
            {{ filter.label }}
          </ElCheckbox>
        </template>
      </div>

      <slot name="actions" />

    </div>

    <template v-if="filteredList.length === 0">
      <slot v-if="$slots.noData" name="noData" />
      <div v-else class="no-data">
        <div class="noDataContent">
          <Icon name="mdi:magnify" />
          <span>No data</span>
        </div>
      </div>
    </template>

    <div :class="['list-content', ...(props.containerClass?.split(',') || [])]">
      <slot
        :items="filteredList"
        :sort-by="sortBy"
        :sort-order="sortOrder"
        :is-filtering="isFilterStage"
        :keyword="keyword"
        :filters="isFilterStage ? tempFilterOptions : filterOptions"
      />
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
  flex: 0 0 200px;
  width: 200px;
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
