<template>
  <DashboardCard
    :title="effectiveSetting.label || $t('detailWidget.tableInfo')"
    :hide-setting="hideSetting"
    :setting-ref="settingRef"
    :setting="effectiveSetting"
    @delete="handleDelete"
  >
    <!-- Widget Content -->
    <div class="widget-content" :class="[`layout-${effectiveSetting.layout}`]">
      <template v-if="displayFields.length > 0">
        <div v-for="field in displayFields" :key="field.fieldName" class="field-item" :style="getFieldStyle(field)">
          <div v-if="effectiveSetting.showLabels" class="field-label">
            {{ field.fieldNameAlias || field.fieldName }}
          </div>
          <div class="field-value">
            <component v-if="getFieldRenderer(field)" :is="getFieldRenderer(field)" :value="getFieldValue(field.fieldName)" :field="field" :record="record" />
            <span v-else class="text-value">
              {{ formatFieldValue(field) }}
            </span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="empty-state">
          <Icon name="lucide:file-text" size="32" />
          <span>{{ $t('detailWidget.noFieldsConfigured') }}</span>
          <el-button v-if="!hideSetting" size="small" @click="openSettings">
            {{ $t('common_configure') }}
          </el-button>
        </div>
      </template>
    </div>

    <!-- Settings Dialog -->
    <TableInfoSetting ref="settingRef" :setting="effectiveSetting" :fields="fields" @refresh="handleRefreshSetting" @delete="handleDelete" />
  </DashboardCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TableInfoWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../../types/view-config'
import { ColumnFieldType } from '../../../types/column-types'
import { formatFieldValueByType } from '@packages/dp-mdTable/utils/fieldValueFormat'
import TableInfoSetting from './TableInfoSetting.vue'

const props = defineProps<{
  /** Widget settings */
  setting?: TableInfoWidgetSetting
  /** Hide settings controls (view mode) */
  hideSetting?: boolean
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Record data to display */
  record: Record<string, any>
}>()

const emit = defineEmits<{
  delete: []
  refreshSetting: [setting: TableInfoWidgetSetting]
}>()

const settingRef = ref()

// Default settings
const defaultSetting: TableInfoWidgetSetting = {
  fields: [],
  layout: 'grid',
  showLabels: true,
  gridColumns: 2
}

// Merge with defaults
const effectiveSetting = computed<TableInfoWidgetSetting>(() => ({
  ...defaultSetting,
  ...props.setting
}))

// Get fields to display
const displayFields = computed(() => {
  if (effectiveSetting.value.fields.length === 0) {
    // If no fields configured, show all non-relation fields
    return props.fields.filter((f) => f.type !== ColumnFieldType.Relation && f.type !== ColumnFieldType.VirtualColumn).slice(0, 10)
  }

  return effectiveSetting.value.fields.map((fieldName) => props.fields.find((f) => f.fieldName === fieldName)).filter((f): f is FieldInfo => !!f)
})

// Get field value from record
function getFieldValue(fieldName: string): any {
  return props.record?.[fieldName]
}

function formatFieldValue(field: FieldInfo): string {
  return formatFieldValueByType(getFieldValue(field.fieldName), field)
}

// Get field style based on layout
function getFieldStyle(field: FieldInfo): Record<string, string> {
  if (effectiveSetting.value.layout === 'list') {
    return {}
  }

  const config = effectiveSetting.value.fieldConfigs?.find((c) => c.fieldName === field.fieldName)
  const colSpan = config?.colSpan ?? 6
  return {
    gridColumn: `span ${colSpan}`
  }
}

// Get custom renderer for field type (placeholder for future)
function getFieldRenderer(field: FieldInfo): any {
  // Future: return custom renderer component based on field type
  return null
}

function openSettings() {
  settingRef.value?.handleOpen(effectiveSetting.value)
}

function handleRefreshSetting(newSetting: TableInfoWidgetSetting) {
  emit('refreshSetting', newSetting)
}

function handleDelete() {
  emit('delete')
}

// Expose for parent
defineExpose({
  resize: () => {
    // Handle resize if needed
  }
})
</script>

<style lang="scss" scoped>
.widget-content {
  flex: 1;
  padding: var(--app-space-m);
  overflow: auto;

  &.layout-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--app-space-m);
    align-content: start;
  }

  &.layout-list {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-s);
  }
}

.field-item {
  min-width: 0;
}

.field-label {
  font-size: var(--app-font-size-xs);
  color: var(--el-text-color-secondary);
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-value {
  font-size: var(--app-font-size-s);
  color: var(--el-text-color-primary);
  word-break: break-word;

  .text-value {
    display: block;
    line-height: 1.5;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xl);
  color: var(--el-text-color-placeholder);
  text-align: center;
}
</style>
