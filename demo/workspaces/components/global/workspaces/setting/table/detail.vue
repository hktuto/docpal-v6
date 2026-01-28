<script setup lang="ts">
/**
 * Detail View Settings
 * 
 * Allows editing the detail view layout using DetailViewLayout component.
 * Uses mock record data for preview.
 */
import { ElMessage } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/useSingleWorkspace'
import type { CaseTableRecord, CaseFieldRecord } from '../../../../../utils/db/schema/newTableSchema'
import { DetailViewLayout } from '#components'
import { generateDefaultDetailLayout, getDetailWidgetsByType, detailWidgetSettings, detailWidgetComponent } from '#imports'
import type { DetailWidgetSetting } from '#imports'

interface FieldInfo {
  fieldName: string
  fieldNameAlias: string
  type: number
  isSystem?: boolean
  relationTableId?: string
}

const { workspaceRouteParams, findItemById, menuState } = useSingleWorkspaceContext()
const { query } = usePglite()

// State
const loading = ref(true)
const tableData = ref<CaseTableRecord | null>(null)
const fields = ref<FieldInfo[]>([])
const layout = ref<DetailWidgetSetting[]>([])
const mockRecord = ref<Record<string, any>>({})

// Widget configuration
const widgetSettingList = getDetailWidgetsByType(detailWidgetSettings)

// Get table item from menu
const tableItem = computed(() => {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
})

const tableId = computed(() => tableItem.value?.itemId)

/**
 * Load table data and fields
 */
async function loadTableData() {
  if (!tableId.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    // 1. Get table info
    const tables = await query<CaseTableRecord>(
      `SELECT * FROM case_tables WHERE id = $1`,
      [tableId.value]
    )
    
    if (tables.length === 0) {
      throw new Error('Table not found')
    }
    
    tableData.value = tables[0]

    // 2. Get table fields
    const fieldData = await query<CaseFieldRecord>(
      `SELECT * FROM case_fields WHERE "tableId" = $1 ORDER BY "createdAt" ASC`,
      [tableId.value]
    )
    
    fields.value = fieldData.map(f => ({
      fieldName: f.fieldName,
      fieldNameAlias: f.fieldNameAlias || f.fieldName,
      type: f.displayStructure?.type || 19,
      isSystem: f.fieldName.startsWith('_') || ['id', 'created_at', 'updated_at', 'created_by'].includes(f.fieldName),
      relationTableId: f.relationTableId || undefined
    }))

    // 3. Generate mock record data for preview
    mockRecord.value = generateMockRecord(fields.value)

    // 4. Get or generate detail layout
    const formStructure = tableData.value.formStructure as any
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

  } catch (error) {
    console.error('Error loading table data:', error)
    ElMessage.error('Failed to load table data')
  } finally {
    loading.value = false
  }
}

/**
 * Generate mock record data for preview
 */
function generateMockRecord(fieldList: FieldInfo[]): Record<string, any> {
  const record: Record<string, any> = {
    id: 'mock-record-id'
  }

  fieldList.forEach(field => {
    switch (field.type) {
      case 19: // Text
      case 1:  // MultiText
        record[field.fieldName] = `Sample ${field.fieldNameAlias}`
        break
      case 2:  // Number
        record[field.fieldName] = 42
        break
      case 3:  // SingleSelect
        record[field.fieldName] = 'Option A'
        break
      case 4:  // MultiSelect
        record[field.fieldName] = ['Option A', 'Option B']
        break
      case 5:  // DateTime
        record[field.fieldName] = new Date().toISOString()
        break
      case 9:  // Email
        record[field.fieldName] = 'sample@example.com'
        break
      case 11: // Checkbox
        record[field.fieldName] = true
        break
      case 12: // Rating
        record[field.fieldName] = 4
        break
      case 14: // MagicLink
        record[field.fieldName] = []
        break
      default:
        record[field.fieldName] = `Sample value`
    }
  })

  return record
}

/**
 * Handle saving the layout
 */
async function handleSaveLayout() {
  if (!tableData.value) return

  try {
    const formStructure = {
      ...(tableData.value.formStructure as any || {}),
      detail: {
        widgets: layout.value
      }
    }

    await query(
      `UPDATE case_tables SET "formStructure" = $1, "updatedAt" = $2 WHERE id = $3`,
      [JSON.stringify(formStructure), new Date().toISOString(), tableId.value]
    )

    ElMessage.success('Detail view layout saved')
  } catch (error) {
    console.error('Failed to save layout:', error)
    ElMessage.error('Failed to save layout')
  }
}

/**
 * Handle adding a new widget
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

/**
 * Reset to default layout
 */
async function handleResetLayout() {
  if (!fields.value.length) return

  const fieldData = fields.value.map(f => ({
    fieldName: f.fieldName,
    type: f.type,
    relationTableId: f.relationTableId
  }))

  layout.value = generateDefaultDetailLayout(fieldData)
  await handleSaveLayout()
  ElMessage.success('Layout reset to default')
}

// Load data on mount and when table changes
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
  <div class="detail-setting">
    <!-- Header -->
    <div class="setting-header">
      <div class="header-info">
        <h3>Detail View Layout</h3>
        <p class="description">
          Configure how individual records are displayed in the detail view. 
          Drag widgets from the sidebar to customize the layout.
        </p>
      </div>
      <div class="header-actions">
        <el-button @click="handleResetLayout">
          <Icon name="lucide:rotate-ccw" size="14" />
          Reset to Default
        </el-button>
        <el-button type="primary" @click="handleSaveLayout">
          <Icon name="lucide:save" size="14" />
          Save Layout
        </el-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading">
        <Icon name="lucide:loader-2" />
      </el-icon>
      <span>Loading...</span>
    </div>

    <!-- Layout Editor -->
    <div v-else class="layout-editor">
      <DetailViewLayout
        v-model:layout="layout"
        :edit-mode="true"
        :hide-setting="false"
        :resizable="true"
        :draggable="true"
        :widget-setting-list="widgetSettingList"
        :component-map="detailWidgetComponent"
        :fields="fields"
        :record="mockRecord"
        @add="handleAddWidget"
        @save="handleSaveLayout"
        @delete="handleDeleteWidget"
        @refresh-setting="handleRefreshSetting"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-setting {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--app-space-m);
  margin-bottom: var(--app-space-m);
  flex-shrink: 0;

  .header-info {
    h3 {
      margin: 0 0 var(--app-space-xs);
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }

    .description {
      margin: 0;
      color: var(--app-grey-500);
      font-size: var(--app-font-size-s);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--app-space-s);
    flex-shrink: 0;
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--app-space-m);
  color: var(--el-text-color-secondary);

  .el-icon {
    font-size: 32px;
  }
}

.layout-editor {
  flex: 1;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}
</style>
