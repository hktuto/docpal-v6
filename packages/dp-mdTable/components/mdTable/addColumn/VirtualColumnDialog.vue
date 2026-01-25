<template>
  <UiPopoverDialog ref="popoverRef" :width="300">
    <div class="virtual-column-dialog">
      <h4 class="dialog-title">Add Virtual Column</h4>
      <p class="dialog-description">
        Select a display field to show as a separate column
      </p>
      
      <div v-if="loading" class="loading-state">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="availableFields.length === 0" class="empty-state">
        <Icon name="lucide:info" size="16" />
        <span>No display fields available. Configure display fields in the relation column settings first.</span>
      </div>
      
      <div v-else class="fields-list">
        <div
          v-for="field in availableFields"
          :key="field.name"
          class="field-item"
          :class="{ disabled: field.isAlreadyVirtual }"
          @click="!field.isAlreadyVirtual && handleSelect(field.name)"
        >
          <div class="field-info">
            <span class="field-name">{{ field.label }}</span>
            <span v-if="field.isAlreadyVirtual" class="field-badge">Already added</span>
          </div>
          <Icon v-if="!field.isAlreadyVirtual" name="lucide:plus" size="16" class="add-icon" />
        </div>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { ColumnContextKey } from '../../../composables/useColumns'
import type { ColumnConfig } from '../../../composables/useColumns'

const emit = defineEmits<{
  select: [relationFieldName: string, displayFieldName: string]
}>()

const columnContext = inject(ColumnContextKey)
const popoverRef = ref()
const loading = ref(false)
const currentColumn = ref<ColumnConfig | null>(null)

interface FieldOption {
  name: string
  label: string
  isAlreadyVirtual: boolean
}

const availableFields = ref<FieldOption[]>([])

async function open(triggerEl: HTMLElement, column: ColumnConfig) {
  currentColumn.value = column
  loading.value = true
  popoverRef.value.open(triggerEl)
  
  try {
    await loadAvailableFields(column)
  } finally {
    loading.value = false
  }
}

async function loadAvailableFields(column: ColumnConfig) {
  const displayFieldNames = column.properties?.displayFieldNames || []
  const relationFieldName = column.field
  
  if (displayFieldNames.length === 0) {
    availableFields.value = []
    return
  }
  
  // Check which display fields are already added as virtual columns
  const existingVirtualColumns = columnContext?.columns.value
    .filter(col => col.field.startsWith(`${relationFieldName}.`))
    .map(col => col.field.split('.')[1]) || []
  
  // Get field labels from target table if possible
  let fieldLabels: Record<string, string> = {}
  if (column.properties?.relationTableId && columnContext?.getFieldsForTable) {
    try {
      const fields = await columnContext.getFieldsForTable(column.properties.relationTableId)
      fieldLabels = Object.fromEntries(fields.map(f => [f.fieldName, f.fieldNameAlias]))
    } catch (e) {
      console.warn('Could not load field labels:', e)
    }
  }
  
  availableFields.value = displayFieldNames.map((name: string) => ({
    name,
    label: fieldLabels[name] || name,
    isAlreadyVirtual: existingVirtualColumns.includes(name)
  }))
}

function handleSelect(displayFieldName: string) {
  if (!currentColumn.value) return
  
  emit('select', currentColumn.value.field, displayFieldName)
  popoverRef.value.close()
}

function close() {
  popoverRef.value.close()
}

defineExpose({
  open,
  close
})
</script>

<style scoped lang="scss">
.virtual-column-dialog {
  padding: 4px;
}

.dialog-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dialog-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.loading-state {
  padding: 8px 0;
}

.empty-state {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover:not(.disabled) {
    background: var(--el-fill-color-light);
    
    .add-icon {
      color: var(--el-color-primary);
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
}

.field-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.field-badge {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.add-icon {
  color: var(--el-text-color-placeholder);
}
</style>
