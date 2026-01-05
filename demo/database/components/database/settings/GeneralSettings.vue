<script lang="ts" setup>
import type { Database, Table, TableType } from '../../../types/database'
import { useDatabase } from '../../../composables/useDatabase'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  database: Database
  table: Table
}>()

const emit = defineEmits<{
  updated: []
}>()

const { updateTable } = useDatabase()

// Form state
const form = ref({
  name: '',
  description: '',
  tableType: 'private' as TableType
})

// Initialize form
watchEffect(() => {
  form.value = {
    name: props.table.name,
    description: props.table.description || '',
    tableType: props.table.tableType || 'private'
  }
})

// Track if form has changes
const hasChanges = computed(() => {
  return (
    form.value.name !== props.table.name ||
    form.value.description !== (props.table.description || '') ||
    form.value.tableType !== (props.table.tableType || 'private')
  )
})

function handleSave() {
  updateTable(props.database.id, props.table.id, {
    name: form.value.name,
    description: form.value.description,
    tableType: form.value.tableType
  })
  ElMessage.success('Table settings updated')
  emit('updated')
}

function handleReset() {
  form.value = {
    name: props.table.name,
    description: props.table.description || '',
    tableType: props.table.tableType || 'private'
  }
}
</script>

<template>
  <div class="settings-section">
    <div class="section-header">
      <h2 class="section-title">General Settings</h2>
      <p class="section-description">
        Basic information and configuration for this table
      </p>
    </div>

    <div class="section-content">
      <el-form label-position="top" class="settings-form">
        <!-- Table Name -->
        <el-form-item label="Table Name" required>
          <el-input
            v-model="form.name"
            placeholder="Enter table name"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <!-- Description -->
        <el-form-item label="Description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="Describe what this table is for..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- Table Type -->
        <el-form-item label="Table Type">
          <el-radio-group v-model="form.tableType" class="table-type-group">
            <el-radio value="private" class="table-type-radio">
              <div class="radio-content">
                <div class="radio-label">
                  <el-icon><Lock /></el-icon>
                  <span>Private</span>
                </div>
                <div class="radio-description">
                  Only accessible within this database. Cannot be linked externally or shared publicly.
                </div>
              </div>
            </el-radio>
            <el-radio value="public" class="table-type-radio">
              <div class="radio-content">
                <div class="radio-label">
                  <el-icon><Link /></el-icon>
                  <span>Public</span>
                </div>
                <div class="radio-description">
                  Can be linked across databases and shared externally with proper permissions.
                </div>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- Action Buttons -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleReset" :disabled="!hasChanges">
              Reset
            </el-button>
            <el-button
              type="primary"
              @click="handleSave"
              :disabled="!hasChanges || !form.name"
            >
              Save Changes
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.settings-section {
  max-width: 800px;
  padding: var(--app-space-xl);
}

.section-header {
  margin-bottom: var(--app-space-xl);
}

.section-title {
  margin: 0 0 var(--app-space-xs) 0;
  font-size: var(--app-font-size-xxl);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.section-description {
  margin: 0;
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
}

.section-content {
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-l);
}

.settings-form {
  .el-form-item {
    margin-bottom: var(--app-space-l);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.table-type-group {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
}

.table-type-radio {
  height: auto;
  margin-right: 0;
  padding: var(--app-space-m);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-s);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-primary-color-light-9);
  }

  :deep(.el-radio__input.is-checked) ~ .radio-content {
    .radio-label {
      color: var(--app-primary-color);
    }
  }

  :deep(.el-radio__input.is-checked) {
    & + .el-radio__label {
      color: inherit;
    }
  }
}

.radio-content {
  flex: 1;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-l);
  font-weight: 500;
  margin-bottom: var(--app-space-xxs);
}

.radio-description {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
  line-height: 1.5;
}

.form-actions {
  display: flex;
  gap: var(--app-space-s);
  padding-top: var(--app-space-m);
  border-top: 1px solid var(--app-border-color);
}
</style>

