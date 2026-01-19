<template>
  <div class="relation-config">
    <el-form-item label="Target Table" prop="relationTableId">
      <el-select
        v-model="formData.relationTableId"
        placeholder="Select target table"
        style="width: 100%"
        @change="handleTableChange"
      >
        <el-option
          v-for="table in availableTables"
          :key="table.id"
          :label="table.name"
          :value="table.id"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="Display Field" prop="displayField">
      
      <el-select
        v-model="formData.displayField"
        placeholder="Select field to display"
        style="width: 100%"
        :disabled="!formData.relationTableId"
      >
        <el-option
          v-for="field in targetFields"
          :key="field.id"
          :label="field.fieldNameAlias"
          :value="field.fieldName"
        >
          <div class="field-option">
            <span>{{ field.fieldNameAlias }}</span>
            <!-- <span class="field-name">{{ field.fieldName }}</span> -->
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item label="Allow Multiple" prop="allowMultiple">
      <div class="switch-container">
        <span>Allow selecting multiple records</span>
        <el-switch v-model="formData.allowMultiple" />
      </div>
    </el-form-item>

    <!-- <el-form-item label="Allow Create" prop="allowCreate">
      <div class="switch-container">
        <span>Allow creating new records</span>
        <el-switch v-model="formData.allowCreate" />
      </div>
    </el-form-item> -->

    <!-- <div v-if="formData.relationTableId" class="relation-info">
      <div class="info-header">
        <Icon name="lucide:info" />
        <span>Relation Info</span>
      </div>
      <div class="info-content">
        <div class="info-item">
          <span class="label">Target Table:</span>
          <span class="value">{{ getTableName(formData.relationTableId) }}</span>
        </div>
        <div v-if="formData.displayField" class="info-item">
          <span class="label">Display Field:</span>
          <span class="value">{{ formData.displayField }}</span>
        </div>
        <div class="info-item">
          <span class="label">Type:</span>
          <span class="value">{{ formData.allowMultiple ? 'Many-to-Many' : 'Many-to-One' }}</span>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, inject } from 'vue'
import { ColumnContextKey } from '../../../../composables/useColumns'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../../demo/workspaces/utils/db/schema/newTableSchema'

const props = defineProps<{
  formData: any
}>()

// Inject column context from parent
const columnContext = inject(ColumnContextKey)

const availableTables = ref<CaseTableRecord[]>([])
const targetFields = ref<CaseFieldRecord[]>([])

// Initialize form data with defaults
const initializeFormData = () => {
  if (!props.formData.relationTableId) {
    props.formData.relationTableId = ''
  }
  if (!props.formData.displayField) {
    props.formData.displayField = ''
  }
  if (props.formData.allowMultiple === undefined) {
    props.formData.allowMultiple = false
  }
  if (props.formData.allowCreate === undefined) {
    props.formData.allowCreate = false
  }
}

// Load available tables using context
async function loadAvailableTables() {
  try {
    if (!columnContext?.getAvailableTablesForRelation) {
      console.error('getAvailableTablesForRelation not available in context')
      return
    }
    
    const tables = await columnContext.getAvailableTablesForRelation(false)
    availableTables.value = tables
  } catch (error) {
    console.error('Error loading tables:', error)
  }
}

// Handle table selection change
async function handleTableChange() {
  // Clear display field when table changes
  props.formData.displayField = ''
  targetFields.value = []
  
  if (!props.formData.relationTableId) return
  
  try {
    if (!columnContext?.getFieldsForTable) {
      console.error('getFieldsForTable not available in context')
      return
    }
    
    const fields = await columnContext.getFieldsForTable(props.formData.relationTableId)
    targetFields.value = fields
    
    // Auto-select first text field as display field if available
    const firstTextField = fields.find(f => 
      f.displayStructure?.type === 1 || // Text
      f.displayStructure?.type === 2    // MultiText
    )
    if (firstTextField && !props.formData.displayField) {
      props.formData.displayField = firstTextField.fieldName
    }
  } catch (error) {
    console.error('Error loading fields:', error)
  }
}

// Get table name by ID
function getTableName(tableId: string): string {
  const table = availableTables.value.find(t => t.id === tableId)
  return table?.name || 'Unknown'
}

// Watch for relationTableId changes from parent (edit mode)
watch(
  () => props.formData.relationTableId,
  async (newValue, oldValue) => {
    // Only reload fields if table actually changed (not initial load)
    if (newValue && newValue !== oldValue && targetFields.value.length === 0) {
      await handleTableChange()
    }
  }
)

// Initialize on mount
onMounted(async () => {
  initializeFormData()
  await loadAvailableTables()
  
  // If editing existing relation with a table selected, load target fields
  // This preserves the existing displayField value
  if (props.formData.relationTableId) {
    try {
      if (!columnContext?.getFieldsForTable) {
        console.error('getFieldsForTable not available in context')
        return
      }
      
      const fields = await columnContext.getFieldsForTable(props.formData.relationTableId)
      targetFields.value = fields
      
      // Only auto-select if no displayField is set yet
      if (!props.formData.displayField) {
        const firstTextField = fields.find(f => 
          f.displayStructure?.type === 1 || // Text
          f.displayStructure?.type === 2    // MultiText
        )
        if (firstTextField) {
          props.formData.displayField = firstTextField.fieldName
        }
      }
    } catch (error) {
      console.error('Error loading fields on mount:', error)
    }
  }
})
</script>

<style scoped lang="scss">
.relation-config {
  .field-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .field-name {
      font-size: var(--app-font-size-xs);
      color: var(--el-text-color-secondary);
      font-family: monospace;
    }
  }

  .switch-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    span {
      font-size: var(--app-font-size-s);
      color: var(--el-text-color-regular);
    }
  }

  .relation-info {
    margin-top: var(--app-space-m);
    padding: var(--app-space-m);
    background: var(--el-fill-color-light);
    border-radius: var(--el-border-radius-base);
    border: 1px solid var(--el-border-color-lighter);
    
    .info-header {
      display: flex;
      align-items: center;
      gap: var(--app-space-xs);
      margin-bottom: var(--app-space-s);
      font-weight: 600;
      color: var(--el-text-color-primary);
      font-size: var(--app-font-size-s);
    }
    
    .info-content {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-xs);
    }
    
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--app-font-size-s);
      
      .label {
        color: var(--el-text-color-secondary);
      }
      
      .value {
        color: var(--el-text-color-primary);
        font-weight: 500;
        font-family: monospace;
      }
    }
  }
}
</style>
