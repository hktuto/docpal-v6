<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { CaseViewRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  menuItem: any
}>()



const loading = ref(false)
const saving = ref(false)
const viewData = ref<CaseViewRecord | null>(null)
const allFields = ref<CaseFieldRecord[]>([])
const selectedFields = ref<string[]>([])

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
      // Clone the fields array to avoid reactivity issues
      selectedFields.value = views[0].fields ? [...views[0].fields] : []

      // Load all fields from the base table
      const fields = await query<CaseFieldRecord>(
        `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "fieldNameAlias"`,
        [views[0].tableId]
      )
      allFields.value = fields
    }
  } catch (error) {
    console.error('Error loading data:', error)
    ElMessage.error('Failed to load view fields')
  } finally {
    loading.value = false
  }
}

function isFieldSelected(fieldName: string): boolean {
  return selectedFields.value.includes(fieldName)
}

function toggleField(fieldName: string) {
  const index = selectedFields.value.indexOf(fieldName)
  if (index === -1) {
    selectedFields.value.push(fieldName)
  } else {
    selectedFields.value.splice(index, 1)
  }
}

function selectAllFields() {
  selectedFields.value = allFields.value.map(f => f.fieldName)
}

function deselectAllFields() {
  selectedFields.value = []
}

// Check if there are unsaved changes
const hasChanges = computed(() => {
  if (!viewData.value) return false
  const original = viewData.value.fields || []
  if (original.length !== selectedFields.value.length) return true
  return !original.every((f, i) => selectedFields.value.includes(f))
})

async function handleSave() {
  if (!viewData.value) return

  if (selectedFields.value.length === 0) {
    ElMessage.warning('Please select at least one field to display')
    return
  }

  saving.value = true
  try {
    // Convert to plain array for PGlite compatibility
    const fieldsArray = [...selectedFields.value]

    await query(
      `UPDATE case_views SET fields = $1, "updatedAt" = $2 WHERE id = $3`,
      [fieldsArray, new Date(), viewData.value.id]
    )

    // Update local data
    viewData.value.fields = fieldsArray

    ElMessage.success('View fields saved successfully')
  } catch (error) {
    console.error('Error saving fields:', error)
    ElMessage.error('Failed to save fields. Please try again.')
  } finally {
    saving.value = false
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
  <div class="view-fields-settings">
    <div class="section-header">
      <h2>View Fields</h2>
      <p>Select which fields to display in this view. Checked fields will be visible.</p>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="material-symbols:progress-activity" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <template v-else>
      <!-- Quick Actions -->
      <div class="quick-actions">
        <el-button size="small" @click="selectAllFields">
          <Icon name="lucide:check-square" />
          Select All
        </el-button>
        <el-button size="small" @click="deselectAllFields">
          <Icon name="lucide:square" />
          Deselect All
        </el-button>
        <span class="selection-count">
          {{ selectedFields.length }} of {{ allFields.length }} fields visible
        </span>
      </div>

      <!-- Fields List -->
      <div class="fields-list">
        <div
          v-for="field in allFields"
          :key="field.id"
          class="field-item"
          :class="{ selected: isFieldSelected(field.fieldName) }"
          tabindex="0"
          :aria-label="`Toggle ${field.fieldNameAlias}`"
          @click="toggleField(field.fieldName)"
          @keydown.enter="toggleField(field.fieldName)"
        >
          <el-checkbox
            :model-value="isFieldSelected(field.fieldName)"
            @click.stop
            @change="toggleField(field.fieldName)"
          />
          <div class="field-info">
            <span class="field-label">{{ field.fieldNameAlias }}</span>
            <span class="field-name">{{ field.fieldName }}</span>
          </div>
          <el-tag size="small" type="info">{{ field.businessType }}</el-tag>
        </div>

        <div v-if="allFields.length === 0" class="empty-state">
          <Icon name="lucide:columns" class="empty-icon" />
          <p>No fields found in the base table.</p>
          <p class="hint">Add fields to the table first to configure view visibility.</p>
        </div>
      </div>

      <!-- Save Button -->
      <div class="actions">
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!hasChanges"
          @click="handleSave"
        >
          <Icon v-if="!saving" name="lucide:save" />
          Save Changes
        </el-button>
        <span v-if="hasChanges" class="unsaved-indicator">
          <Icon name="lucide:circle" class="dot" />
          Unsaved changes
        </span>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.view-fields-settings {
  max-width: 600px;
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

.quick-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);

  .el-button {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }

  .selection-count {
    margin-left: auto;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary);
  }
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  margin-bottom: var(--app-space-l);
  max-height: 400px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-s) var(--app-space-m);
  border: 1px solid var(--el-border-color);
  border-radius: var(--app-border-radius);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-fill-color-light);
  }

  &.selected {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.field-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .field-label {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-name {
    font-size: var(--app-font-size-xs);
    color: var(--el-text-color-secondary);
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--app-space-xl);
  text-align: center;
  color: var(--el-text-color-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: var(--app-space-m);
    color: var(--el-text-color-placeholder);
  }

  p {
    margin: 0;
  }

  .hint {
    font-size: var(--app-font-size-s);
    margin-top: var(--app-space-xs);
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--el-border-color);

  .el-button {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
  }
}

.unsaved-indicator {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
  color: var(--el-color-warning);

  .dot {
    font-size: 8px;
  }
}
</style>
