<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseFieldRecord, FieldDisplayStructure } from '../../../../../utils/db/schema/newTableSchema'
import { v7 as uuidv7 } from 'uuid'

const props = defineProps<{
  column?: CaseFieldRecord | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = ref({
  fieldName: '',
  fieldNameAlias: '',
  businessType: 'text',
  fieldType: 'text',
  displayType: 1, // Text type by default
  isRequired: false,
  isUnique: false,
  isHidden: false,
  defaultValue: ''
})

const rules: FormRules = {
  fieldNameAlias: [
    { required: true, message: 'Please enter column title', trigger: 'blur' }
  ],
  fieldName: [
    { required: true, message: 'Please enter field name', trigger: 'blur' },
    { pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/, message: 'Field name must start with letter or underscore and contain only letters, numbers, and underscores', trigger: 'blur' }
  ]
}

const columnTypes = [
  { value: 1, label: 'Text', businessType: 'text', fieldType: 'text' },
  { value: 2, label: 'Number', businessType: 'number', fieldType: 'numeric' },
  { value: 3, label: 'Single Select', businessType: 'text', fieldType: 'text' },
  { value: 4, label: 'Multi Select', businessType: 'text', fieldType: 'text' },
  { value: 5, label: 'Date', businessType: 'date', fieldType: 'timestamp' },
  { value: 6, label: 'Checkbox', businessType: 'boolean', fieldType: 'boolean' },
  { value: 7, label: 'User', businessType: 'text', fieldType: 'uuid' },
  { value: 8, label: 'Attachment', businessType: 'text', fieldType: 'text' },
  { value: 9, label: 'Relation', businessType: 'relation', fieldType: 'uuid' },
  { value: 10, label: 'Formula', businessType: 'formula', fieldType: 'text' }
]

const dialogTitle = computed(() => {
  return props.column ? 'Edit Column' : 'Add Column'
})

// Auto-generate field name from title
watch(() => formData.value.fieldNameAlias, (newValue) => {
  if (!props.column && newValue) {
    // Convert title to snake_case for field name
    formData.value.fieldName = newValue
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }
})

// Update business type and field type when display type changes
watch(() => formData.value.displayType, (newValue) => {
  const typeInfo = columnTypes.find(t => t.value === newValue)
  if (typeInfo) {
    formData.value.businessType = typeInfo.businessType
    formData.value.fieldType = typeInfo.fieldType
  }
})

// Initialize form with existing column data
onMounted(() => {
  if (props.column) {
    formData.value = {
      fieldName: props.column.fieldName,
      fieldNameAlias: props.column.fieldNameAlias,
      businessType: props.column.businessType,
      fieldType: props.column.fieldType,
      displayType: props.column.displayStructure?.type || 1,
      isRequired: props.column.isRequired,
      isUnique: props.column.isUnique || false,
      isHidden: props.column.isHidden,
      defaultValue: props.column.defaultValue || ''
    }
  }
})

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    return
  }

  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || !treeItem.itemId) {
    ElMessage.error('Table not found')
    return
  }

  loading.value = true
  try {
    const displayStructure: FieldDisplayStructure = {
      type: formData.value.displayType as any,
      properties: {}
    }

    const now = new Date().toISOString()

    if (props.column) {
      // Update existing column
      await query(
        `UPDATE case_fields 
         SET "fieldNameAlias" = $1, "businessType" = $2, "fieldType" = $3,
             "displayStructure" = $4, "isRequired" = $5, "isUnique" = $6, 
             "isHidden" = $7, "defaultValue" = $8, "updatedAt" = $9
         WHERE id = $10`,
        [
          formData.value.fieldNameAlias,
          formData.value.businessType,
          formData.value.fieldType,
          JSON.stringify(displayStructure),
          formData.value.isRequired,
          formData.value.isUnique,
          formData.value.isHidden,
          formData.value.defaultValue || null,
          now,
          props.column.id
        ]
      )
      ElMessage.success('Column updated successfully')
    } else {
      // Create new column
      const fieldId = uuidv7()
      await query(
        `INSERT INTO case_fields (
          id, "tableId", "fieldName", "fieldNameAlias", "businessType", "fieldType",
          "displayStructure", "isRequired", "isHidden", "isArray", "isUnique",
          "defaultValue", "fieldLength", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          fieldId,
          treeItem.itemId,
          formData.value.fieldName,
          formData.value.fieldNameAlias,
          formData.value.businessType,
          formData.value.fieldType,
          JSON.stringify(displayStructure),
          formData.value.isRequired,
          formData.value.isHidden,
          false, // isArray
          formData.value.isUnique,
          formData.value.defaultValue || null,
          0, // fieldLength
          now,
          now
        ]
      )
      ElMessage.success('Column added successfully')
    }

    emit('saved')
    emit('close')
  } catch (error) {
    console.error('Error saving column:', error)
    ElMessage.error('Failed to save column')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <el-dialog
    :model-value="true"
    :title="dialogTitle"
    width="500px"
    @close="handleCancel"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleSubmit"
    >
      <el-form-item label="Column Title" prop="fieldNameAlias">
        <el-input
          v-model="formData.fieldNameAlias"
          placeholder="Enter column title"
          :disabled="loading"
        />
      </el-form-item>

      <el-form-item label="Field Name" prop="fieldName">
        <el-input
          v-model="formData.fieldName"
          placeholder="field_name"
          :disabled="!!column || loading"
        />
        <template #extra>
          <span class="form-tip">Database column name (cannot be changed after creation)</span>
        </template>
      </el-form-item>

      <el-form-item label="Column Type" prop="displayType">
        <el-select
          v-model="formData.displayType"
          placeholder="Select column type"
          style="width: 100%"
          :disabled="loading"
        >
          <el-option
            v-for="type in columnTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Default Value">
        <el-input
          v-model="formData.defaultValue"
          placeholder="Enter default value (optional)"
          :disabled="loading"
        />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="formData.isRequired" :disabled="loading">
          Required field
        </el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="formData.isUnique" :disabled="loading">
          Unique values
        </el-checkbox>
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="formData.isHidden" :disabled="loading">
          Hidden field
        </el-checkbox>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel" :disabled="loading">Cancel</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ column ? 'Update' : 'Create' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.form-tip {
  font-size: var(--app-font-size-xs);
  color: var(--app-grey-500);
}
</style>
