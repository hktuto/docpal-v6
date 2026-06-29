<template>
  <div class="record-dashboard" v-loading="saving">
    <div v-if="canManage" class="record-dashboard__toolbar">
      <el-button v-if="!editMode" size="small" :icon="Edit" @click="editMode = true">
        {{ $t('common_edit') }}
      </el-button>
      <el-button v-else size="small" type="primary" @click="handleDone">
        {{ $t('common_done') }}
      </el-button>
    </div>
    <DashboardDetail
      v-model:layout="layout"
      :resizable="editMode"
      :draggable="editMode"
      :hide-setting="!editMode"
      :edit-mode="editMode"
      :dashboard-setting-list="recordWidgetRegistryByType"
      @add="handleAdd"
      @save="handleSave"
      @delete="handleDelete"
      @refreshSetting="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ViewDashboardLayoutItem } from '../../utils/databaseType'
import { getRecordDashboardWidgetByType } from '../../utils/dashboardWidgets'
import { useTableViewsInject } from '../../composables/table/useTableViews'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { RecordDashboardContextKey } from '../../composables/dashboard/recordDashboardContext'

const { t } = useI18n()

const props = defineProps<{
  recordId?: string | number
  tableId?: string
  record?: Record<string, any>
  canManage?: boolean
}>()

const { currentView, updateView, tableFields } = useTableViewsInject()

provide(RecordDashboardContextKey, {
  record: computed(() => props.record ?? {}) as Ref<Record<string, any>>,
  tableId: computed(() => props.tableId ?? '') as Ref<string>,
  tableFields
})

const editMode = ref(false)
const saving = ref(false)
const defaultLayoutCache = ref<{ key: string; layout: ViewDashboardLayoutItem[] } | null>(null)

function getDefaultLayoutKey(): string {
  const fieldNames = tableFields.value.map((f: any) => f.field_name).join(',')
  return `${props.tableId}:${props.recordId}:${fieldNames}`
}

function generateDefaultRecordLayout(tableFields: any[]): ViewDashboardLayoutItem[] {
  const cacheKey = getDefaultLayoutKey()
  if (defaultLayoutCache.value?.key === cacheKey) {
    return defaultLayoutCache.value.layout
  }

  const layout: ViewDashboardLayoutItem[] = []
  let currentY = 0

  const nonRelationFields = tableFields.filter((f: any) => f.business_type !== ColumnFieldType.Relation && f.business_type !== ColumnFieldType.VirtualColumn)

  const defaultInfoFields = nonRelationFields.slice(0, 4).map((f: any) => f.field_name)

  if (defaultInfoFields.length > 0) {
    layout.push({
      x: 0,
      y: currentY,
      w: 6,
      h: 4,
      i: `DbRecordInfo-default`,
      component: 'LazyDbRecordInfoWidget',
      label: 'DbRecordInfo',
      minW: 4,
      minH: 2,
      maxW: 12,
      maxH: 12,
      setting: {
        label: 'Record Info',
        fields: defaultInfoFields,
        fieldConfigs: defaultInfoFields.map((name: string) => ({
          fieldName: name,
          colSpan: 6
        })),
        layout: 'grid',
        showLabels: true,
        gridColumns: 2,
        recordId: props.recordId,
        tableId: props.tableId,
        _recordContext: true
      }
    })
    currentY += 4
  }

  const relationFields = tableFields.filter((f: any) => f.business_type === ColumnFieldType.Relation)

  relationFields.forEach((field: any) => {
    layout.push({
      x: 0,
      y: currentY,
      w: 12,
      h: 5,
      i: `DbRecordRelation-${field.field_name}`,
      component: 'LazyDbRecordRelationWidget',
      label: 'DbRecordRelation',
      minW: 4,
      minH: 3,
      maxW: 12,
      maxH: 12,
      setting: {
        label: field.field_name_alias || field.field_name,
        relationFieldName: field.field_name,
        displayColumns: [],
        pageSize: 5,
        allowAdd: false,
        allowOpen: true,
        recordId: props.recordId,
        tableId: props.tableId,
        _recordContext: true
      }
    })
    currentY += 5
  })

  defaultLayoutCache.value = { key: cacheKey, layout }
  return layout
}

const initialLayout = computed(() => {
  const persisted = currentView.value?.dashboard?.layout ?? []
  if (persisted.length > 0) return persisted
  if (!props.record || Object.keys(props.record).length === 0) return []
  return generateDefaultRecordLayout(tableFields.value)
})

const layout = ref<ViewDashboardLayoutItem[]>([])

watch(
  initialLayout,
  (value) => {
    layout.value = JSON.parse(JSON.stringify(value))
  },
  { immediate: true }
)

const recordWidgetRegistryByType = computed(() => {
  return getRecordDashboardWidgetByType()
})

async function persistLayout() {
  if (!currentView.value) return
  saving.value = true
  try {
    const dashboard = { layout: JSON.parse(JSON.stringify(layout.value)) }
    await updateView(currentView.value.id, { dashboard })
  } catch (error) {
    console.error('Failed to persist dashboard layout:', error)
    ElMessage.error(t('common_saveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleAdd(data: any) {
  const timestamp = Date.now().toString()
  const newItem: ViewDashboardLayoutItem = {
    x: 0,
    y: 0,
    w: data.w || 4,
    h: data.h || 4,
    i: `${data.label}-${timestamp}`,
    component: data.component,
    label: data.label,
    minW: data.minW,
    minH: data.minH,
    maxW: data.maxW,
    maxH: data.maxH,
    setting: {
      ...(data.setting ? { ...data.setting } : {}),
      recordId: props.recordId,
      tableId: props.tableId,
      _recordContext: true
    }
  }
  layout.value.push(newItem)
  await persistLayout()
}

async function handleDelete(i: string) {
  const index = layout.value.findIndex((item) => item.i === i)
  if (index !== -1) {
    layout.value.splice(index, 1)
    await persistLayout()
  }
}

async function handleRefresh(row: any) {
  const index = layout.value.findIndex((item) => item.i === row.i)
  if (index !== -1) {
    layout.value[index] = { ...layout.value[index], ...row }
    await persistLayout()
  }
}

async function handleSave() {
  await persistLayout()
}

async function handleDone() {
  await persistLayout()
  editMode.value = false
}
</script>

<style scoped lang="scss">
.record-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &__toolbar {
    display: flex;
    justify-content: flex-end;
    padding: var(--app-space-xs) 0;
  }
}
</style>
