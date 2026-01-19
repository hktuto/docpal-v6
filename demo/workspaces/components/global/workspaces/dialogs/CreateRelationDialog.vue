<template>
  <el-dialog
    v-model="visible"
    title="Create Relation"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="create-relation-dialog">
      <div class="description">
        Create a relation column by matching values from "{{ sourceColumn?.title }}" with another table's field.
      </div>

      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="Target Table" prop="targetTableId">
          <el-select
            v-model="formData.targetTableId"
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

        <el-form-item label="Match Field" prop="targetFieldId">
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
          <div class="field-hint">
            Match "{{ sourceColumn?.title }}" values with this field in the target table
          </div>
        </el-form-item>

        <el-form-item label="Display Field" prop="displayFieldId">
          <el-select
            v-model="formData.displayFieldId"
            placeholder="Select field to display"
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
          <div class="field-hint">
            This field from the target table will be shown in the relation column
          </div>
        </el-form-item>

        <el-form-item label="New Relation Column Name" prop="relationColumnName">
          <el-input
            v-model="formData.relationColumnName"
            placeholder="Enter name for the new relation column"
          />
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
              ? 'Each row can link to multiple records in the target table' 
              : 'Each row can link to only one record in the target table' 
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
            <div v-if="matchPreview.samples.length > 0" class="preview-samples">
              <div class="samples-title">Sample Matches:</div>
              <div v-for="(sample, idx) in matchPreview.samples" :key="idx" class="sample-item">
                <span class="sample-value">{{ sample.sourceValue }}</span>
                <Icon name="lucide:arrow-right" />
                <span class="sample-value">{{ sample.targetValue }}</span>
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
const { getAvailableTablesForRelation, getFieldsForTable } = useColumnsContext()

const emit = defineEmits<{
  created: [data: {
    targetTableId: string
    targetFieldId: string
    displayFieldId: string
    relationColumnName: string
    allowMultiple: boolean
  }]
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const sourceColumn = ref<any>(null)
const sourceTableId = ref<string>('')
const sourceTableName = ref<string>('')
const availableTables = ref<CaseTableRecord[]>([])
const targetFields = ref<CaseFieldRecord[]>([])
const matchPreview = ref<MatchPreview | null>(null)

const formData = reactive({
  targetTableId: '',
  targetFieldId: '',
  displayFieldId: '',
  relationColumnName: '',
  allowMultiple: false
})

const rules: FormRules = {
  targetTableId: [{ required: true, message: 'Please select a target table', trigger: 'change' }],
  targetFieldId: [{ required: true, message: 'Please select a match field', trigger: 'change' }],
  displayFieldId: [{ required: true, message: 'Please select a display field', trigger: 'change' }],
  relationColumnName: [{ required: true, message: 'Please enter a column name', trigger: 'blur' }]
}

const canCreate = computed(() => {
  return formData.targetTableId && formData.targetFieldId && formData.displayFieldId && formData.relationColumnName && !loading.value
})

async function open(column: any, tableId: string, tableName: string) {
  sourceColumn.value = column
  sourceTableId.value = tableId
  sourceTableName.value = tableName
  visible.value = true
  
  // Set default relation column name
  formData.relationColumnName = `${column.title} (Relation)`
  
  // Load available tables
  await loadAvailableTables()
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
  formData.displayFieldId = ''
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
    
    // Set default display field to the first field (usually 'name' or similar)
    if (fields.length > 0) {
      formData.displayFieldId = fields[0].id
    }
  } catch (error) {
    console.error('Error loading fields:', error)
    ElMessage.error('Failed to load fields')
  }
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
    
    // Get source values
    const sourceRows = await query<Record<string, any>>(
      `SELECT "${sourceColumn.value.field}" FROM "${sourceTableName.value}" 
       WHERE "${sourceColumn.value.field}" IS NOT NULL`
    )
    const sourceValues = sourceRows.map(r => String(r[sourceColumn.value.field]))
    
    // Get target values
    const targetRows = await query<Record<string, any>>(
      `SELECT "${targetField.fieldName}" FROM "${targetTable.tableName}" 
       WHERE "${targetField.fieldName}" IS NOT NULL`
    )
    const targetValueSet = new Set(targetRows.map(r => String(r[targetField.fieldName])))
    
    // Calculate matches
    const matches = sourceValues.filter(v => targetValueSet.has(v))
    const matchPercentage = sourceValues.length > 0 
      ? Math.round((matches.length / sourceValues.length) * 100)
      : 0
    
    // Get sample matches
    const samples = matches.slice(0, 5).map(v => ({
      sourceValue: v,
      targetValue: v
    }))
    
    matchPreview.value = {
      matchPercentage,
      matchedCount: matches.length,
      totalCount: sourceValues.length,
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
      displayFieldId: formData.displayFieldId,
      relationColumnName: formData.relationColumnName,
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
  targetFields.value = []
  matchPreview.value = null
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.create-relation-dialog {
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
      gap: var(--app-space-s);
      padding: var(--app-space-xs);
      font-size: var(--app-font-size-s);
      
      .sample-value {
        flex: 1;
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
