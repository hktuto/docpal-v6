<script lang="ts" setup>
import type { Table, ViewType } from '../../types/database'

const props = defineProps<{
  modelValue: boolean
  tables: Table[]
  preselectedTableId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'create': [data: {
    name: string
    tableId: string
    type: ViewType
  }]
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const form = ref<{
  name: string
  tableId: string
  type: ViewType
}>({
  name: '',
  tableId: '',
  type: 'table'
})

// Initialize with preselected table
watch(() => props.preselectedTableId, (newVal) => {
  if (newVal) {
    form.value.tableId = newVal
  }
}, { immediate: true })

// Reset form when dialog opens
watch(dialogVisible, (visible) => {
  if (visible) {
    form.value = {
      name: '',
      tableId: props.preselectedTableId || props.tables[0]?.id || '',
      type: 'table'
    }
  }
})

const viewTypeOptions: { value: ViewType; label: string; icon: string; description: string }[] = [
  { value: 'table', label: 'Table', icon: '📋', description: 'Grid view with rows and columns' },
  { value: 'kanban', label: 'Kanban', icon: '📌', description: 'Cards grouped by status' },
  { value: 'gantt', label: 'Gantt', icon: '📊', description: 'Timeline with date ranges' },
  { value: 'calendar', label: 'Calendar', icon: '📅', description: 'Events on a calendar' },
  { value: 'gallery', label: 'Gallery', icon: '🖼️', description: 'Card-based gallery view' }
]

// Validation
const isValid = computed(() => {
  return form.value.name.trim() && form.value.tableId
})

function handleCreate() {
  if (!isValid.value) return
  
  emit('create', {
    name: form.value.name.trim(),
    tableId: form.value.tableId,
    type: form.value.type
  })
  
  dialogVisible.value = false
}

function handleCancel() {
  dialogVisible.value = false
}

// Get table icon
function getTableIcon(iconName?: string): string {
  const icons: Record<string, string> = {
    'building': '🏢',
    'user': '👤',
    'file-text': '📄',
    'list': '📋',
    'file-signature': '✍️',
    'database': '📊',
    'chart-bar': '📈'
  }
  return icons[iconName || 'database'] || '📊'
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="Create Personal View"
    width="500px"
    :close-on-click-modal="false"
    @close="handleCancel"
  >
    <el-form label-position="top">
      <!-- View Name -->
      <el-form-item label="View Name" required>
        <el-input
          v-model="form.name"
          placeholder="e.g., My Sales Pipeline, High Value Deals..."
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <!-- Base Table -->
      <el-form-item label="Base Table" required>
        <el-select
          v-model="form.tableId"
          placeholder="Select a table"
          :disabled="!!preselectedTableId"
          class="table-select"
        >
          <el-option
            v-for="table in tables"
            :key="table.id"
            :label="table.name"
            :value="table.id"
          >
            <span class="table-option">
              <span class="table-icon">{{ getTableIcon(table.icon) }}</span>
              <span>{{ table.name }}</span>
            </span>
          </el-option>
        </el-select>
        <div class="form-help">
          Choose the table this view will be based on
        </div>
      </el-form-item>

      <!-- View Type -->
      <el-form-item label="View Type">
        <div class="view-type-grid">
          <div
            v-for="option in viewTypeOptions"
            :key="option.value"
            class="view-type-card"
            :class="{ active: form.type === option.value }"
            @click="form.type = option.value"
          >
            <span class="view-type-icon">{{ option.icon }}</span>
            <span class="view-type-label">{{ option.label }}</span>
          </div>
        </div>
        <div class="form-help">
          You can change the view type later
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="!isValid"
        @click="handleCreate"
      >
        Create View
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.table-select {
  width: 100%;
}

.table-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.table-icon {
  font-size: var(--app-font-size-m);
}

.form-help {
  margin-top: var(--app-space-xxs);
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
}

.view-type-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--app-space-xs);
}

.view-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--app-space-xxs);
  padding: var(--app-space-s);
  border: 2px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-primary-alpha-5);
  }
  
  &.active {
    border-color: var(--app-primary-color);
    background: var(--app-primary-alpha-10);
  }
}

.view-type-icon {
  font-size: var(--app-font-size-xl);
}

.view-type-label {
  font-size: var(--app-font-size-xs);
  font-weight: 500;
  color: var(--app-text-color-primary);
}
</style>

