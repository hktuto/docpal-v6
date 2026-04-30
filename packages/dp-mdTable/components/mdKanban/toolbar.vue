<template>
  <div v-if="showToolbar" class="kanban-toolbar">
    <div class="toolbar-left">
      <MdKanbanToolsFilterButton :available-columns="availableColumns" @filter-change="handleFilterChange" />
      <MdKanbanToolsSortButton :available-columns="availableColumns" @sort-change="handleSortChange" />
      <slot name="toolbar-left" />
    </div>
    <div class="toolbar-right">
      <slot name="toolbar-right">
        <el-button text :icon="Setting" @click="handleOpenSettings">
          Setting
        </el-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Setting } from '@element-plus/icons-vue'

interface Props {
  showToolbar?: boolean
  availableColumns?: any[]
}

interface Emits {
  (e: 'refresh'): void
  (e: 'search', value: string): void
  (e: 'add-row'): void
  (e: 'open-settings'): void
  (e: 'filter-change', rules: any): void
  (e: 'sort-change', rules: any): void
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  availableColumns: () => []
})

const emit = defineEmits<Emits>()

const handleAddRow = () => {
  emit('add-row')
}

const handleOpenSettings = () => {
  emit('open-settings')
}

const handleFilterChange = (rules: any) => {
  emit('filter-change', rules)
}

const handleSortChange = (rules: any) => {
  emit('sort-change', rules)
}
</script>

<style scoped lang="scss">
.kanban-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-s);
  border-bottom: 1px solid var(--app-grey-800);
  background: var(--app-paper);
  border-radius: var(--app-border-radius-s);
  flex-shrink: 0;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}
</style>
