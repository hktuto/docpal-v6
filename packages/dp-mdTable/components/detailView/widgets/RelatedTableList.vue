<template>
  <DashboardCard :title="widgetTitle" :hide-setting="hideSetting" :setting-ref="settingRef" :setting="effectiveSetting" @delete="handleDelete">
    <template #title_suffix>
      <el-tag v-if="relatedRecords.length > 0" size="small" type="info">
        {{ relatedRecords.length }}
      </el-tag>
    </template>
    <template #action_prefix>
      <el-button v-if="effectiveSetting.allowAdd && !hideSetting" size="small" type="primary" text @click="handleAddRelated">
        <Icon name="lucide:plus" size="14" />
      </el-button>
    </template>

    <!-- Widget Content -->
    <div class="widget-content">
      <template v-if="!effectiveSetting.relationFieldName">
        <!-- No relation configured -->
        <div class="empty-state">
          <Icon name="lucide:link" size="32" />
          <span>{{ $t('detailWidget.selectRelation') }}</span>
          <el-button v-if="!hideSetting" size="small" @click="openSettings">
            {{ $t('common_configure') }}
          </el-button>
        </div>
      </template>

      <template v-else>
        <div class="related-table__toolbar">
          <ToolsFilterButton :available-columns="availableFilterColumns" :column-filter-rules="runtimeFilterRules" @filter-change="onRuntimeFilterChange" />
          <ToolsSortButton :available-columns="availableFilterColumns" @sort-change="onRuntimeSortChange" />
        </div>

        <template v-if="loading">
          <div class="loading-state">
            <el-icon class="is-loading">
              <Icon name="lucide:loader-2" />
            </el-icon>
            <span>{{ $t('common_loading') }}</span>
          </div>
        </template>

        <template v-else-if="relatedRecords.length === 0">
          <div class="empty-state">
            <Icon name="lucide:inbox" size="32" />
            <span>{{ $t('detailWidget.noRelatedRecords') }}</span>
          </div>
        </template>

        <template v-else>
          <!-- Related Records Table -->
          <div class="records-table">
            <div
              v-for="record in paginatedRecords"
              :key="record.id"
              class="record-row"
              :class="{ clickable: effectiveSetting.allowOpen }"
              @click="handleOpenRecord(record)"
            >
              <div v-for="col in displayColumns" :key="col" class="record-cell">
                <span class="cell-value">{{ formatCellValue(record, col) }}</span>
              </div>
              <div v-if="effectiveSetting.allowOpen" class="record-action">
                <Icon name="lucide:external-link" size="14" />
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="effectiveSetting.pageSize"
              :total="relatedRecords.length"
              layout="prev, pager, next"
              small
            />
          </div>
        </template>
      </template>
    </div>

    <!-- Settings Dialog -->
    <RelatedTableListSetting
      ref="settingRef"
      :setting="effectiveSetting"
      :relation-fields="relationFields"
      :target-fields="targetFields"
      @refresh="handleRefreshSetting"
      @delete="handleDelete"
    />
  </DashboardCard>
</template>

<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import type { RelatedTableListWidgetSetting } from '../../../utils/detailWidgetHelper'
import type { FieldInfo } from '../../../types/view-config'
import type { ColumnConfig } from '../../../types/column-context'
import { ColumnFieldType } from '../../../types/column-types'
import type { FilterRules } from '../../tools/filter/ConfigPopover.vue'
import type { SortRule } from '../../tools/sort/configPopover.vue'
import RelatedTableListSetting from './RelatedTableListSetting.vue'
import ToolsFilterButton from '../../tools/filter/Button.vue'
import ToolsSortButton from '../../tools/sort/button.vue'

const { t } = useI18n()

const props = defineProps<{
  /** Widget settings */
  setting?: RelatedTableListWidgetSetting
  /** Hide settings controls (view mode) */
  hideSetting?: boolean
  /** Available fields from the table */
  fields: FieldInfo[]
  /** Current record data */
  record: Record<string, any>
  /** Function to fetch related records */
  fetchRelatedRecords?: (
    relationFieldName: string,
    recordIds: string[],
    options: {
      filterRules?: FilterRules
      runtimeFilterRules?: FilterRules
      sortRules?: SortRule[]
      runtimeSortRules?: SortRule[]
    }
  ) => Promise<any[]>
  /** Function to get fields for target table */
  getTargetFields?: (relationTableId: string) => Promise<FieldInfo[]>
  /** Function to navigate to a record */
  onOpenRecord?: (tableId: string, recordId: string) => void
}>()

const emit = defineEmits<{
  delete: []
  refreshSetting: [setting: RelatedTableListWidgetSetting]
}>()

const settingRef = ref()
const loading = ref(false)
const relatedRecords = ref<any[]>([])
const targetFields = ref<FieldInfo[]>([])
const currentPage = ref(1)

// Runtime filter/sort state
const runtimeFilterRules = ref<FilterRules>({
  conditions: [],
  conjunction: 'AND'
})

const runtimeSortRules = ref<SortRule[]>([])

// Provide viewTools so the sort button can access runtime sort rules
provide('viewTools', { columnSortRules: runtimeSortRules })

// Default settings
const defaultSetting: RelatedTableListWidgetSetting = {
  relationFieldName: '',
  displayColumns: [],
  pageSize: 5,
  allowAdd: true,
  allowOpen: true
}

// Merge with defaults
const effectiveSetting = computed<RelatedTableListWidgetSetting>(() => ({
  ...defaultSetting,
  ...props.setting
}))

// Get relation fields from table fields
const relationFields = computed(() => {
  return props.fields.filter((f) => f.type === ColumnFieldType.Relation)
})

// Get current relation field
const relationField = computed(() => {
  return relationFields.value.find((f) => f.fieldName === effectiveSetting.value.relationFieldName)
})

// Columns available for runtime filter/sort
const availableFilterColumns = computed<ColumnConfig[]>(() => {
  return targetFields.value
    .filter(
      (f) =>
        f.type !== ColumnFieldType.Relation &&
        f.type !== ColumnFieldType.VirtualColumn &&
        f.type !== ColumnFieldType.Formula &&
        f.type !== ColumnFieldType.AggVirtualColumn
    )
    .map((f) => ({
      field: f.fieldName,
      title: f.fieldNameAlias || f.fieldName,
      field_name: f.fieldName,
      field_name_alias: f.fieldNameAlias,
      business_type: f.type,
      display_structure: f.properties || {}
    }))
})

// Widget title
const widgetTitle = computed(() => {
  return effectiveSetting.value.label || relationField.value?.fieldNameAlias || relationField.value?.fieldName || t('detailWidget.relatedTableList')
})

// Get columns to display
const displayColumns = computed(() => {
  if (effectiveSetting.value.displayColumns.length > 0) {
    return effectiveSetting.value.displayColumns
  }
  // Default: show first 3 text columns from target table
  return targetFields.value
    .filter((f) => f.type === ColumnFieldType.Text || f.type === ColumnFieldType.MultiText)
    .slice(0, 3)
    .map((f) => f.fieldName)
})

// Pagination
const totalPages = computed(() => {
  return Math.ceil(relatedRecords.value.length / effectiveSetting.value.pageSize)
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * effectiveSetting.value.pageSize
  const end = start + effectiveSetting.value.pageSize
  return relatedRecords.value.slice(start, end)
})

// Get icon for relation
function getRelationIcon(): string {
  return 'lucide:link'
}

// Format cell value for display
function formatCellValue(record: any, fieldName: string): string {
  const value = record[fieldName]
  if (value === null || value === undefined) return '-'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function onRuntimeFilterChange(rules: FilterRules) {
  runtimeFilterRules.value = rules
  currentPage.value = 1
  fetchRelatedRecordsData()
}

function onRuntimeSortChange(rules: SortRule[]) {
  runtimeSortRules.value = rules
  currentPage.value = 1
  fetchRelatedRecordsData()
}

function normalizeRecordIds(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return [value]
}

// Fetch related records when relation changes
async function fetchRelatedRecordsData() {
  if (!props.fetchRelatedRecords) return

  const fieldName = effectiveSetting.value.relationFieldName
  if (!fieldName) return

  const recordIds = normalizeRecordIds(props.record[fieldName])
  if (!recordIds.length) {
    relatedRecords.value = []
    return
  }

  loading.value = true
  try {
    relatedRecords.value = await props.fetchRelatedRecords(fieldName, recordIds, {
      filterRules: effectiveSetting.value.filterRules,
      runtimeFilterRules: runtimeFilterRules.value,
      sortRules: effectiveSetting.value.sortRules,
      runtimeSortRules: runtimeSortRules.value
    })
  } catch (error) {
    console.error('Failed to fetch related records:', error)
    relatedRecords.value = []
  } finally {
    loading.value = false
  }
}

// Load target table fields
async function loadTargetFields() {
  const field = relationField.value
  if (!field?.relationTableId || !props.getTargetFields) {
    targetFields.value = []
    return
  }

  try {
    targetFields.value = await props.getTargetFields(field.relationTableId)
  } catch (error) {
    console.error('Failed to fetch target fields:', error)
    targetFields.value = []
  }
}

// Watch for setting changes
watch(
  () => effectiveSetting.value.relationFieldName,
  async () => {
    currentPage.value = 1
    runtimeFilterRules.value = { conditions: [], conjunction: 'AND' }
    runtimeSortRules.value = []
    await loadTargetFields()
    await fetchRelatedRecordsData()
  },
  { immediate: true }
)

const recordIds = computed(() => {
  return normalizeRecordIds(props.record[effectiveSetting.value.relationFieldName])
})

watch(recordIds, () => fetchRelatedRecordsData(), { immediate: true })

function openSettings() {
  settingRef.value?.handleOpen(effectiveSetting.value)
}

function handleRefreshSetting(newSetting: RelatedTableListWidgetSetting) {
  emit('refreshSetting', newSetting)
}

function handleDelete() {
  emit('delete')
}

function handleAddRelated() {
  // TODO: Open add relation dialog
  console.log('Add related record')
}

function handleOpenRecord(record: any) {
  if (!effectiveSetting.value.allowOpen) return

  const field = relationField.value
  if (field?.relationTableId && props.onOpenRecord) {
    props.onOpenRecord(field.relationTableId, record.id)
  }
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
  overflow: auto;
  display: flex;
  flex-direction: column;
}

.related-table__toolbar {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.records-table {
  flex: 1;
}

.record-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-s) var(--app-space-m);
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &.clickable {
    cursor: pointer;

    &:hover {
      background: var(--el-fill-color-light);
    }
  }
}

.record-cell {
  flex: 1;
  min-width: 0;

  .cell-value {
    display: block;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.record-action {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.pagination {
  padding: var(--app-space-s) var(--app-space-m);
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: center;
}

.empty-state,
.loading-state {
  flex: 1;
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
