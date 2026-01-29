<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'
import { ViewConfigFormViewEditor } from '#components'
import type { FormViewConfig, FieldInfo } from '#imports'

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

// Table data
const tableData = ref<CaseTableRecord | null>(null)
const tableFields = ref<CaseFieldRecord[]>([])
const isLoading = ref(true)

// Current form configuration
const formConfig = ref<FormViewConfig | undefined>(undefined)

// System field names that should be excluded from forms
const systemFieldNames = new Set(['id', 'created_at', 'updated_at', 'created_by', 'updated_by', 'col_id'])

// Convert CaseFieldRecord to FieldInfo for the editor
const fieldInfoList = computed<FieldInfo[]>(() => {
  return tableFields.value.map((field) => ({
    fieldName: field.fieldName,
    fieldNameAlias: field.fieldNameAlias || field.fieldName,
    type: field.displayStructure?.type || 19, // Default to Text
    isSystem: field.isHidden || systemFieldNames.has(field.fieldName) || field.fieldName?.startsWith('_'),
    properties: field.displayStructure?.properties || {}
  }))
})

// Load table data and fields
async function loadTableData() {
  const treeItem = findItemById(menuState.value.items, workspaceRouteParams.value.detailId || '')
  if (!treeItem || treeItem.itemType !== 'table' || !treeItem.itemId) {
    isLoading.value = false
    return
  }

  try {
    // Load table
    const tables = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [treeItem.itemId])

    if (Array.isArray(tables) && tables.length > 0) {
      tableData.value = tables[0]

      // Load form config from formStructure
      if (tableData.value?.formStructure?.form) {
        formConfig.value = tableData.value.formStructure.form as FormViewConfig
      }
    }

    // Load fields
    const fields = await query<CaseFieldRecord>(`SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt"`, [treeItem.itemId])
    tableFields.value = Array.isArray(fields) ? fields : []
  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  } finally {
    isLoading.value = false
  }
}

// Save form configuration
async function handleSaveFormConfig(config: FormViewConfig) {
  if (!tableData.value) return

  try {
    const now = new Date().toISOString()

    // Merge with existing formStructure
    const updatedFormStructure = {
      ...tableData.value.formStructure,
      form: config
    }

    await query(
      `UPDATE case_tables
       SET "formStructure" = $1, "updatedAt" = $2
       WHERE id = $3`,
      [JSON.stringify(updatedFormStructure), now, tableData.value.id]
    )

    // Update local state
    tableData.value.formStructure = updatedFormStructure
    formConfig.value = config

    ElMessage.success('Form configuration saved successfully')
  } catch (error) {
    console.error('Error saving form config:', error)
    ElMessage.error('Failed to save form configuration')
  }
}

// Handle cancel - reload from saved
function handleCancel() {
  // Reload to reset any unsaved changes
  loadTableData()
}

onMounted(() => {
  loadTableData()
})

watch(
  () => workspaceRouteParams.value.detailId,
  () => {
    loadTableData()
  }
)
</script>

<template>
  <div class="form-settings">
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="!tableData" class="empty-state">
      <Icon name="lucide:table" size="48" />
      <p>No table selected</p>
    </div>

    <ViewConfigFormViewEditor v-else v-model="formConfig" :fields="fieldInfoList" :sample-data="{}" @save="handleSaveFormConfig" @cancel="handleCancel" />
  </div>
</template>

<style lang="scss" scoped>
.form-settings {
  height: 100%;
}

.loading-state {
  padding: var(--app-space-l);
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-m);
  color: var(--el-text-color-placeholder);

  p {
    margin: 0;
    font-size: var(--app-font-size-m);
  }
}
</style>
