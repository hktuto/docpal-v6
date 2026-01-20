<template>
  <el-dialog
    v-model="visible"
    title="Create Relation to Other Table"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-reverse-relation-dialog">
      <div class="description">
        Add a relation column in another table that links back to "{{ sourceColumn?.title }}" in this table.
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="Target Table" prop="targetTableId">
          <el-select
            v-model="formData.targetTableId"
            placeholder="Select table to add relation column to"
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

        <el-form-item label="Match Field in Target Table" prop="targetFieldId">
          <el-select
            v-model="formData.targetFieldId"
            placeholder="Select field to match against"
            style="width: 100%"
            :disabled="!formData.targetTableId"
          >
            <el-option
              v-for="field in targetFields"
              :key="field.id"
              :label="field.fieldNameAlias"
              :value="field.id"
            >
              <div class="field-option">
                <span>{{ field.fieldNameAlias }}</span>
                <span class="field-name">{{ field.fieldName }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="New Relation Column Name" prop="relationColumnName">
          <el-input
            v-model="formData.relationColumnName"
            placeholder="Enter name for the new relation column"
          />
          <div class="field-hint">
            This column will be added to {{ getTableName(formData.targetTableId) || 'the target table' }}
          </div>
        </el-form-item>

        <el-form-item label="Display Field" prop="displayFieldId">
          <el-select
            v-model="formData.displayFieldId"
            placeholder="Select field to display from this table"
            style="width: 100%"
          >
            <el-option
              v-for="field in sourceFields"
              :key="field.id"
              :label="field.fieldNameAlias"
              :value="field.id"
            >
              <div class="field-option">
                <span>{{ field.fieldNameAlias }}</span>
                <span class="field-name">{{ field.fieldName }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="field-hint">
            This field from {{ sourceTableName }} will be shown in the relation column
          </div>
        </el-form-item>

        <el-form-item label="Relation Type">
          <el-switch
            v-model="formData.allowMultiple"
            active-text="Allow Multiple (One-to-Many)"
            inactive-text="Single (Many-to-One)"
            style="--el-switch-on-color: var(--el-color-primary)"
          />
          <div class="field-hint">
            {{ formData.allowMultiple 
              ? 'Each row in the target table can link to multiple records in this table' 
              : 'Each row in the target table can link to only one record in this table' 
            }}
          </div>
        </el-form-item>

        <div v-if="matchPreview" class="match-preview">
          <div class="preview-header">
            <Icon name="lucide:info" />
            <span>Preview</span>
          </div>
          <div class="preview-content">
            <div class="preview-stat">
              <span class="label">Match Rate:</span>
              <span class="value">{{ matchPreview.matchPercentage }}%</span>
            </div>
            <div class="preview-stat">
              <span class="label">Matched Rows:</span>
              <span class="value">{{ matchPreview.matchedCount }} / {{ matchPreview.totalCount }}</span>
            </div>
            <div class="preview-info">
              <Icon name="lucide:arrow-right" />
              <span>{{ matchPreview.matchedCount }} rows in {{ getTableName(formData.targetTableId) }} will link to this table</span>
            </div>
            <div v-if="matchPreview.samples.length > 0" class="preview-samples">
              <div class="samples-title">Sample Matches:</div>
              <div v-for="(sample, idx) in matchPreview.samples" :key="idx" class="sample-item">
                <span class="sample-label">{{ getTableName(formData.targetTableId) }}:</span>
                <span class="sample-value">{{ sample.targetValue }}</span>
                <Icon name="lucide:arrow-right" />
                <span class="sample-label">{{ sourceTableName }}:</span>
                <span class="sample-value">{{ sample.sourceValue }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">Cancel</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          Create Relation
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../utils/db/schema/newTableSchema'

interface MatchPreview {
  matchPercentage: number
  matchedCount: number
  totalCount: number
  samples: Array<{
    sourceValue: string
    targetValue: string
  }>
}

const { query } = usePglite()
const {getAvailableTablesForRelation, getFieldsForTable} = useColumnsContext()

const emit = defineEmits<{
  created: [data: {
    targetTableId: string
    targetFieldId: string
    relationColumnName: string
    displayFieldId: string
    allowMultiple: boolean
  }]
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const sourceColumn = ref<any>(null)
const sourceTableId = ref<string>('')
const sourceTableName = ref<string>('')
const sourcePhysicalTableName = ref<string>('')
const availableTables = ref<CaseTableRecord[]>([])
const sourceFields = ref<CaseFieldRecord[]>([])
const targetFields = ref<CaseFieldRecord[]>([])
const matchPreview = ref<MatchPreview | null>(null)

const formData = reactive({
  targetTableId: '',
  targetFieldId: '',
  relationColumnName: '',
  displayFieldId: '',
  allowMultiple: false
})

const rules: FormRules = {
  targetTableId: [{ required: true, message: 'Please select a target table', trigger: 'change' }],
  targetFieldId: [{ required: true, message: 'Please select a target field', trigger: 'change' }],
  relationColumnName: [{ required: true, message: 'Please enter a column name', trigger: 'blur' }],
  displayFieldId: [{ required: true, message: 'Please select a display field', trigger: 'change' }]
}

const canCreate = computed(() => {
  return formData.targetTableId && formData.targetFieldId && formData.relationColumnName && formData.displayFieldId && !loading.value
})

async function open(column: any, tableId: string, tableName: string, physicalTableName: string) {
  sourceColumn.value = column
  sourceTableId.value = tableId
  sourceTableName.value = tableName
  sourcePhysicalTableName.value = physicalTableName
  visible.value = true
  
  // Load source table fields
  await loadSourceFields()
  
  // Set default relation column name
  formData.relationColumnName = `${tableName} (Relation)`
  
  // Load available tables
  await loadAvailableTables()
}

async function loadSourceFields() {
  try {
    if (!getFieldsForTable) {
      console.error('getFieldsForTable not available')
      ElMessage.error('Failed to load source fields')
      return
    }
    
    // Load all fields from the source table
    const fields = await getFieldsForTable(sourceTableId.value)
    sourceFields.value = fields
    
    // Set default display field to the source column
    if (sourceColumn.value) {
      const sourceField = fields.find(f => f.fieldName === sourceColumn.value.field)
      if (sourceField) {
        formData.displayFieldId = sourceField.id
      }
    }
  } catch (error) {
    console.error('Error loading source fields:', error)
    ElMessage.error('Failed to load source fields')
  }
}

async function loadAvailableTables() {
  try {
    if (!getAvailableTablesForRelation) {
      console.error('getAvailableTablesForRelation not available')
      ElMessage.error('Failed to load tables')
      return
    }
    
    // Get all tables from the same entity, excluding current table
    const tables = await getAvailableTablesForRelation(true)
    availableTables.value = tables
  } catch (error) {
    console.error('Error loading tables:', error)
    ElMessage.error('Failed to load tables')
  }
}

async function handleTableChange() {
  formData.targetFieldId = ''
  targetFields.value = []
  matchPreview.value = null
  
  if (!formData.targetTableId) return
  
  try {
    if (!getFieldsForTable) {
      console.error('getFieldsForTable not available')
      ElMessage.error('Failed to load fields')
      return
    }
    
    // Load fields for the selected table
    const fields = await getFieldsForTable(formData.targetTableId)
    targetFields.value = fields
  } catch (error) {
    console.error('Error loading fields:', error)
    ElMessage.error('Failed to load fields')
  }
}

function getTableName(tableId: string): string {
  if (!tableId) return ''
  const table = availableTables.value.find(t => t.id === tableId)
  return table?.name || 'Unknown'
}

watch(() => formData.targetFieldId, async (newValue) => {
  if (!newValue) {
    matchPreview.value = null
    return
  }
  
  await generateMatchPreview()
})

async function generateMatchPreview() {
  if (!formData.targetTableId || !formData.targetFieldId) return
  
  try {
    const targetTable = availableTables.value.find(t => t.id === formData.targetTableId)
    const targetField = targetFields.value.find(f => f.id === formData.targetFieldId)
    
    if (!targetTable || !targetField) return
    
    // Get source values (current table)
    const sourceRows = await query<Record<string, any>>(
      `SELECT "${sourceColumn.value.field}" FROM "${sourcePhysicalTableName.value}" 
       WHERE "${sourceColumn.value.field}" IS NOT NULL`
    )
    const sourceValues = sourceRows.map(r => String(r[sourceColumn.value.field]))
    const sourceValueSet = new Set(sourceValues)
    
    // Get target values (table to add relation to)
    const targetRows = await query<Record<string, any>>(
      `SELECT "${targetField.fieldName}" FROM "${targetTable.tableName}" 
       WHERE "${targetField.fieldName}" IS NOT NULL`
    )
    const targetValues = targetRows.map(r => String(r[targetField.fieldName]))
    
    // Calculate matches (how many target rows will have a relation)
    const matches = targetValues.filter(v => sourceValueSet.has(v))
    const matchPercentage = targetValues.length > 0 
      ? Math.round((matches.length / targetValues.length) * 100)
      : 0
    
    // Get sample matches
    const samples = matches.slice(0, 5).map(v => ({
      targetValue: v,
      sourceValue: v
    }))
    
    matchPreview.value = {
      matchPercentage,
      matchedCount: matches.length,
      totalCount: targetValues.length,
      samples
    }
  } catch (error) {
    console.error('Error generating preview:', error)
  }
}

async function handleCreate() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    loading.value = true
    
    emit('created', {
      targetTableId: formData.targetTableId,
      targetFieldId: formData.targetFieldId,
      relationColumnName: formData.relationColumnName,
      displayFieldId: formData.displayFieldId,
      allowMultiple: formData.allowMultiple
    })
    
    handleClose()
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    loading.value = false
  }
}

function handleClose() {
  visible.value = false
  formRef.value?.resetFields()
  sourceColumn.value = null
  sourceTableId.value = ''
  sourceTableName.value = ''
  sourcePhysicalTableName.value = ''
  sourceFields.value = []
  targetFields.value = []
  matchPreview.value = null
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.create-reverse-relation-dialog {
  .description {
    margin-bottom: var(--app-space-l);
    padding: var(--app-space-m);
    background: var(--app-grey-950);
    border-radius: var(--app-border-radius);
    color: var(--app-grey-400);
    font-size: var(--app-font-size-s);
  }
}

.field-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .field-name {
    font-size: var(--app-font-size-xs);
    color: var(--app-grey-500);
    font-family: monospace;
  }
}

.field-hint {
  margin-top: var(--app-space-xs);
  font-size: var(--app-font-size-xs);
  color: var(--app-grey-500);
  font-style: italic;
}

.match-preview {
  margin-top: var(--app-space-l);
  padding: var(--app-space-m);
  background: var(--app-grey-950);
  border-radius: var(--app-border-radius);
  border: 1px solid var(--app-grey-800);
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    margin-bottom: var(--app-space-m);
    font-weight: 600;
    color: var(--app-grey-300);
  }
  
  .preview-content {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }
  
  .preview-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--app-space-xs) 0;
    
    .label {
      color: var(--app-grey-500);
      font-size: var(--app-font-size-s);
    }
    
    .value {
      color: var(--app-grey-200);
      font-weight: 500;
    }
  }
  
  .preview-info {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    padding: var(--app-space-s);
    background: var(--app-primary-color-light-9);
    border-radius: var(--app-border-radius-s);
    font-size: var(--app-font-size-s);
    color: var(--app-primary-color);
  }
  
  .preview-samples {
    margin-top: var(--app-space-s);
    padding-top: var(--app-space-s);
    border-top: 1px solid var(--app-grey-800);
    
    .samples-title {
      color: var(--app-grey-500);
      font-size: var(--app-font-size-xs);
      margin-bottom: var(--app-space-xs);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .sample-item {
      display: flex;
      align-items: center;
      gap: var(--app-space-xs);
      padding: var(--app-space-xs);
      font-size: var(--app-font-size-s);
      
      .sample-label {
        color: var(--app-grey-500);
        font-size: var(--app-font-size-xs);
      }
      
      .sample-value {
        padding: var(--app-space-xxs) var(--app-space-xs);
        background: var(--app-grey-900);
        border-radius: var(--app-border-radius-s);
        color: var(--app-grey-300);
        font-family: monospace;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
