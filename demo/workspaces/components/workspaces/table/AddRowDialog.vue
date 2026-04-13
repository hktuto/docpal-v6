<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { FormViewConfig, FieldInfo } from '#imports'
import { generateDefaultFormConfig } from '#imports'

const props = defineProps<{
  tableId: string
  physicalTableName: string
}>()

const emit = defineEmits<{
  submit: [data: Record<string, any>]
}>()

const { query } = usePglite()
const visible = ref(false)
const isLoading = ref(false)
const formConfig = ref<FormViewConfig | undefined>(undefined)
const tableFields = ref<any[]>([])

// System field names that should be excluded from forms
const systemFieldNames = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'col_id'])

// Convert table fields to FieldInfo for the form renderer
const fieldInfoList = computed<FieldInfo[]>(() => {
  return tableFields.value.map((field) => ({
    fieldName: field.fieldName,
    fieldNameAlias: field.fieldNameAlias || field.fieldName,
    type: field.displayStructure?.type || 19, // Default to Text
    isSystem: field.isHidden || systemFieldNames.has(field.fieldName) || field.fieldName?.startsWith('_'),
    properties: field.displayStructure?.properties || {}
  }))
})

// Reference to the form renderer component
const formRendererRef = ref<any>(null)

// Load table data and form configuration
async function loadTableData() {
  if (!props.tableId) return

  isLoading.value = true
  try {
    // Load table to get form configuration
    const tableData = await query<any>(`SELECT "formStructure" FROM case_tables WHERE id = $1`, [props.tableId])

    if (tableData.length > 0 && tableData[0].formStructure?.form) {
      formConfig.value = tableData[0].formStructure.form as FormViewConfig
    }

    // Load fields
    const fields = await query<any>(`SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt"`, [props.tableId])
    tableFields.value = Array.isArray(fields) ? fields : []

    // If no form config exists, generate a default one
    if (!formConfig.value && tableFields.value.length > 0) {
      formConfig.value = generateDefaultFormConfig(fieldInfoList.value)
    }
  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  } finally {
    isLoading.value = false
  }
}

// Open the dialog
async function open() {
  visible.value = true
  await loadTableData()
}

// Close the dialog
function close() {
  visible.value = false
  // Reset form after animation
  setTimeout(() => {
    formRendererRef.value?.resetForm()
  }, 200)
}

// Handle form submission
async function handleSubmit() {
  if (!formRendererRef.value) return

  const isValid = await formRendererRef.value.submitForm()
  if (!isValid) {
    ElMessage.warning('Please fill in all required fields')
    return
  }

  const formData = formRendererRef.value.formData
  emit('submit', { ...formData })
  close()
}

// Expose methods
defineExpose({
  open,
  close
})
</script>

<template>
  <el-dialog v-model="visible" title="Add New Row" width="600px" :close-on-click-modal="false" destroy-on-close>
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="!formConfig || formConfig.fields.length === 0" class="empty-state">
      <Icon name="lucide:form-input" size="48" />
      <p>No form fields configured</p>
      <span class="hint">Please configure form fields in table settings</span>
    </div>

    <ViewConfigFormRenderer v-else ref="formRendererRef" :config="formConfig" :fields="fieldInfoList" :model-value="{}" />

    <template #footer>
      <el-button @click="close">Cancel</el-button>
      <el-button type="primary" :loading="isLoading" @click="handleSubmit"> Add Row </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.loading-state {
  padding: var(--app-space-l);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-xl);
  gap: var(--app-space-s);
  color: var(--el-text-color-placeholder);
  text-align: center;

  p {
    margin: 0;
    font-size: var(--app-font-size-m);
  }

  .hint {
    font-size: var(--app-font-size-s);
  }
}
</style>
