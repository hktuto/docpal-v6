<script setup lang="ts">
/**
 * Record Detail View
 * 
 * Displays a single record using the DetailViewLayout with configurable widgets.
 * Uses the table's formStructure.detail configuration for the layout.
 * 
 * Parent handles the chrome (header, edit buttons) via Teleport to #database-table-header-right.
 * DetailViewLayout follows the same pattern as dashboard/detail.vue.
 */
import { DetailViewLayout } from '#components'
import { generateDefaultDetailLayout, getDetailWidgetsByType, detailWidgetSettings, detailWidgetComponent } from '#imports'
import type { DetailWidgetSetting } from '#imports'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../utils/db/schema/newTableSchema'

interface FieldInfo {
  fieldName: string
  fieldNameAlias: string
  type: number
  isSystem?: boolean
  relationTableId?: string
}

const { query } = usePglite()
const { workspaceRouteParams, goBackFromRecord, navigateToRecord } = useSingleWorkspaceContext()

// Widget configuration - same pattern as dashboard
const widgetSettingList = getDetailWidgetsByType(detailWidgetSettings)

// State
const loading = ref(true)
const error = ref<string | null>(null)
const tableInfo = ref<CaseTableRecord | null>(null)
const record = ref<Record<string, any>>({})
const fields = ref<FieldInfo[]>([])
const layout = ref<DetailWidgetSetting[]>([])
const editMode = ref(false)

// Get current tableId and recordId from route params
const tableId = computed(() => workspaceRouteParams.value.tableId)
const recordId = computed(() => workspaceRouteParams.value.recordId)

// Record title (first text field value or ID)
const recordTitle = computed(() => {
  if (!record.value) return 'Record'
  
  // Find the first text field value
  const textField = fields.value.find(f => f.type === 19 || f.type === 1) // Text or MultiText
  if (textField && record.value[textField.fieldName]) {
    return String(record.value[textField.fieldName])
  }
  
  return `Record ${recordId.value?.slice(0, 8)}...`
})

/**
 * Load record data and configuration
 */
async function loadRecordData() {
  if (!tableId.value || !recordId.value) {
    error.value = 'Missing table or record ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    // 1. Get table info
    const tableData = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [tableId.value]
    )
    
    if (tableData.length === 0) {
      throw new Error('Table not found')
    }
    
    tableInfo.value = tableData[0]
    const physicalTableName = tableInfo.value.tableName

    // 2. Get table fields
    const fieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt" ASC`,
      [tableId.value]
    )
    
    fields.value = fieldData.map(f => ({
      fieldName: f.fieldName,
      fieldNameAlias: f.fieldNameAlias || f.fieldName,
      type: f.displayStructure?.type || 19, // Default to Text
      isSystem: f.fieldName.startsWith('_') || ['id', 'created_at', 'updated_at', 'created_by'].includes(f.fieldName),
      relationTableId: f.relationTableId || undefined
    }))

    // 3. Get record data
    const recordData = await query<Record<string, any>>(
      `SELECT * FROM "${physicalTableName}" WHERE id = $1`,
      [recordId.value]
    )
    
    if (recordData.length === 0) {
      throw new Error('Record not found')
    }
    
    record.value = recordData[0]

    // 4. Get or generate detail layout
    const formStructure = tableInfo.value.formStructure as any
    if (formStructure?.detail?.widgets?.length > 0) {
      layout.value = formStructure.detail.widgets
    } else {
      // Generate default layout
      layout.value = generateDefaultDetailLayout(
        fieldData.map(f => ({
          fieldName: f.fieldName,
          type: f.displayStructure?.type || 19,
          relationTableId: f.relationTableId || undefined
        }))
      )
    }

  } catch (e: any) {
    console.error('Failed to load record:', e)
    error.value = e.message || 'Failed to load record'
  } finally {
    loading.value = false
  }
}

/**
 * Fetch related records for a relation field
 */
async function fetchRelatedRecords(relationFieldName: string, recordIds: string[]): Promise<any[]> {
  const field = fields.value.find(f => f.fieldName === relationFieldName)
  if (!field?.relationTableId) return []

  try {
    // Get target table info
    const targetTable = await query<CaseTableRecord>(
      `SELECT "tableName" FROM case_tables WHERE id = $1`,
      [field.relationTableId]
    )
    
    if (targetTable.length === 0) return []
    
    const targetTableName = targetTable[0].tableName

    // Fetch records
    const records = await query<Record<string, any>>(
      `SELECT * FROM "${targetTableName}" WHERE id = ANY($1)`,
      [recordIds]
    )
    
    return records
  } catch (e) {
    console.error('Failed to fetch related records:', e)
    return []
  }
}

/**
 * Get fields for a target table
 */
async function getTargetFields(targetTableId: string): Promise<FieldInfo[]> {
  try {
    const fieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt" ASC`,
      [targetTableId]
    )
    
    return fieldData.map(f => ({
      fieldName: f.fieldName,
      fieldNameAlias: f.fieldNameAlias || f.fieldName,
      type: f.displayStructure?.type || 19,
      isSystem: f.fieldName.startsWith('_') || ['id', 'created_at', 'updated_at', 'created_by'].includes(f.fieldName)
    }))
  } catch (e) {
    console.error('Failed to fetch target fields:', e)
    return []
  }
}

/**
 * Handle navigating to another record
 */
function handleOpenRecord(targetTableId: string, targetRecordId: string) {
  navigateToRecord(targetTableId, targetRecordId)
}

/**
 * Handle layout changes (save to database)
 */
async function handleSaveLayout() {
  if (!tableInfo.value) return

  try {
    const formStructure = {
      ...(tableInfo.value.formStructure as any || {}),
      detail: {
        widgets: layout.value
      }
    }

    await query(
      `UPDATE case_tables SET "formStructure" = $1, "updatedAt" = $2 WHERE id = $3`,
      [JSON.stringify(formStructure), new Date().toISOString(), tableId.value]
    )
  } catch (e) {
    console.error('Failed to save layout:', e)
  }
}

/**
 * Handle back navigation
 */
function handleBack() {
  goBackFromRecord()
}

/**
 * Handle finishing edit mode
 */
async function handleFinishEdit() {
  editMode.value = false
  await handleSaveLayout()
}

/**
 * Handle adding a new widget (from palette double-click)
 */
function handleAddWidget(widget: DetailWidgetSetting) {
  layout.value.push({
    x: (layout.value.length * 2) % 12,
    y: layout.value.length + 4,
    i: new Date().valueOf().toString(),
    ...widget
  })
}

/**
 * Handle deleting a widget
 */
function handleDeleteWidget(widgetId: string) {
  const index = layout.value.findIndex(item => item.i === widgetId)
  if (index !== -1) {
    layout.value.splice(index, 1)
  }
}

/**
 * Handle refreshing widget settings
 */
function handleRefreshSetting(widgetSetting: DetailWidgetSetting) {
  const index = layout.value.findIndex(item => item.i === widgetSetting.i)
  if (index !== -1) {
    layout.value[index] = { ...widgetSetting }
  }
}

// Load data when tableId/recordId changes
watch(
  [tableId, recordId],
  () => {
    if (tableId.value && recordId.value) {
      loadRecordData()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="record-detail-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="lucide:loader-2" />
      </el-icon>
      <span>Loading record...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <Icon name="lucide:alert-circle" size="48" />
      <h3>Error Loading Record</h3>
      <p>{{ error }}</p>
      <el-button @click="handleBack">
        <Icon name="lucide:arrow-left" size="14" />
        Go Back
      </el-button>
    </div>

    <!-- Record Detail View -->
    <template v-else>
      <!-- Edit buttons teleported to header -->
      <Teleport to="#database-table-header-right">
        <el-button 
          v-if="!editMode" 
          size="small" 
          @click="editMode = true"
        >
          <Icon name="lucide:edit" size="14" />
          {{ $t('common_edit') }}
        </el-button>
        <el-button 
          v-else 
          size="small" 
          type="primary" 
          @click="handleFinishEdit"
        >
          {{ $t('dpButtom_finish') }}
        </el-button>
      </Teleport>

      <DetailViewLayout
        v-model:layout="layout"
        :edit-mode="editMode"
        :hide-setting="!editMode"
        :resizable="editMode"
        :draggable="editMode"
        :widget-setting-list="widgetSettingList"
        :component-map="detailWidgetComponent"
        :fields="fields"
        :record="record"
        :table-name="tableInfo?.tableName"
        :table-id="tableId || undefined"
        :entity-id="tableInfo?.entityId"
        :fetch-related-records="fetchRelatedRecords"
        :get-target-fields="getTargetFields"
        :on-open-record="handleOpenRecord"
        @add="handleAddWidget"
        @save="handleSaveLayout"
        @delete="handleDeleteWidget"
        @refresh-setting="handleRefreshSetting"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.record-detail-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 32px;
  }
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-secondary);
  text-align: center;
  
  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
  }
  
  p {
    margin: 0;
    max-width: 400px;
  }
}
</style>
