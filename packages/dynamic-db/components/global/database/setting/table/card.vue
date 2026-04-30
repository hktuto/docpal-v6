<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/workspace/useSingleDatabase'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'
import { ViewConfigCardViewEditor } from '#components'
import type { CardViewConfig, FieldInfo } from '#imports'

const { databaseMenuRouteParams, findItemById, menuState } = useSingleDatabaseContext()


// Table data
const tableData = ref<CaseTableRecord | null>(null)
const tableFields = ref<CaseFieldRecord[]>([])
const isLoading = ref(true)

// Current card configuration
const cardConfig = ref<CardViewConfig | undefined>(undefined)

// System field names that should be excluded
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
  const treeItem = findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId || '')
  if (!treeItem || treeItem.item_type !== 'table' || !treeItem.itemId) {
    isLoading.value = false
    return
  }

  try {
    // Load table
    const tables = await query<CaseTableRecord>(`SELECT * FROM case_tables WHERE id = $1`, [treeItem.itemId])

    if (Array.isArray(tables) && tables.length > 0) {
      tableData.value = tables[0]

      // Load card config from formStructure
      if (tableData.value?.formStructure?.card) {
        cardConfig.value = tableData.value.formStructure.card as CardViewConfig
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

// Save card configuration
async function handleSaveCardConfig(config: CardViewConfig) {
  if (!tableData.value) return

  try {
    const now = new Date().toISOString()

    // Merge with existing formStructure
    const updatedFormStructure = {
      ...tableData.value.formStructure,
      card: config
    }

    await query(
      `UPDATE case_tables
       SET "formStructure" = $1, "updatedAt" = $2
       WHERE id = $3`,
      [JSON.stringify(updatedFormStructure), now, tableData.value.id]
    )

    // Update local state
    tableData.value.formStructure = updatedFormStructure
    cardConfig.value = config

    ElMessage.success('Card configuration saved successfully')
  } catch (error) {
    console.error('Error saving card config:', error)
    ElMessage.error('Failed to save card configuration')
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
  () => databaseMenuRouteParams.value.detailId,
  () => {
    loadTableData()
  }
)
</script>

<template>
  <div class="card-settings">
    <div v-if="isLoading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>

    <div v-else-if="!tableData" class="empty-state">
      <Icon name="lucide:table" size="48" />
      <p>No table selected</p>
    </div>

    <ViewConfigCardViewEditor v-else v-model="cardConfig" :fields="fieldInfoList" :sample-data="{}" @save="handleSaveCardConfig" @cancel="handleCancel" />
  </div>
</template>

<style lang="scss" scoped>
.card-settings {
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
