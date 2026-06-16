<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-recent-records-widget">
      <el-skeleton v-if="loading" :rows="3" animated />
      <template v-else-if="records.length > 0">
        <div class="records-header">
          <template v-for="field in displayFields" :key="field">
            <span class="header-label">{{ fieldLabel(field) }}</span>
          </template>
        </div>
        <div
          v-for="record in records"
          :key="record.id"
          class="record-item"
          :class="{ clickable: true }"
          @click="handleRowClick(record)"
        >
          <div class="record-fields">
            <template v-for="field in displayFields" :key="field">
              <span class="field-value" :title="formatCellValue(record, field)">
                {{ formatCellValue(record, field) }}
              </span>
            </template>
          </div>
        </div>
      </template>
      <div v-else class="empty-text">No records</div>
    </div>
  </DashboardCard>
  <DbRecentRecordsWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { formatTableFieldDisplayValue } from '@packages/dp-mdTable/utils/fieldValueFormat'
import { SingleDatabaseContextKey } from '../../composables/useSignleDatabase'
import { normalizeSystemDateField, normalizeSystemDateFieldName } from '../../composables/dashboard/useWidgetTableFields'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const records = ref<any[]>([])
const loading = ref(false)
const settingRef = ref()
const cardRef = ref()

const displayTitle = computed(() => props.setting?.title || 'Recent Records')

const displayFields = computed(() => {
  const fields = props.setting?.fields
  if (Array.isArray(fields) && fields.length > 0) {
    return fields.map(normalizeSystemDateFieldName)
  }
  return ['name']
})

const fieldMap = ref<Record<string, any>>({})
const { getFields } = useTableFields()

async function loadFieldMeta(tableId: string) {
  if (!tableId) {
    fieldMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, any> = {}
  for (const f of fields) {
    const field = normalizeSystemDateField(f)
    map[field.field_name] = field
  }
  fieldMap.value = map
}

function fieldLabel(fieldName: string): string {
  const normalizedFieldName = normalizeSystemDateFieldName(fieldName)
  return fieldMap.value[normalizedFieldName]?.field_name_alias || normalizedFieldName
}

function formatCellValue(record: any, fieldName: string): string {
  const normalizedFieldName = normalizeSystemDateFieldName(fieldName)
  const field = fieldMap.value[normalizedFieldName]
  if (!field) return record[normalizedFieldName] ?? ''
  return formatTableFieldDisplayValue(record[normalizedFieldName], field, record)
}

const dbContext = inject(SingleDatabaseContextKey, null)

function handleRowClick(record: any) {
  if (!dbContext || !props.setting?.tableId || !record.id) return
  dbContext.databaseMenuRouteParams.value.detailType = 'record'
  dbContext.databaseMenuRouteParams.value.recordId = record.id
  dbContext.databaseMenuRouteParams.value.tableId = props.setting.tableId
  dbContext.databaseMenuRouteParams.value.pageType = 'detail'
}

async function fetchRecords() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const orderBy: any[] = []
    if (props.setting?.sortField) {
      orderBy.push({
        column: normalizeSystemDateFieldName(props.setting.sortField),
        desc: true
      })
    }
    const { data }: any = await postDynamicActions({
      tableId: props.setting.tableId,
      columns: [{ name: '*' }],
      orderBy,
      pagination: {
        pageSize: props.setting?.limit || 5,
        pageNum: 1
      }
    })
    records.value = data?.data || []
  } catch (error) {
    console.error('Failed to fetch recent records:', error)
    records.value = []
  } finally {
    loading.value = false
  }
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => props.setting?.tableId,
  (tableId) => {
    loadFieldMeta(tableId)
  },
  { immediate: true }
)

watch(
  () => [props.setting?.tableId, props.setting?.limit, props.setting?.sortField],
  () => {
    fetchRecords()
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchRecords
)

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-recent-records-widget {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-space-xs);
}
.records-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) 0;
  border-bottom: 2px solid var(--app-grey-800);
  font-weight: 600;
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}
.header-label {
  flex: 1;
  min-width: 80px;
}
.record-item {
  padding: var(--app-space-xs) 0;
  border-bottom: 1px solid var(--app-grey-900);
  &:last-child {
    border-bottom: none;
  }
  &.clickable {
    cursor: pointer;
    transition: background-color 0.15s ease;
    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }
}
.record-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
}
.field-value {
  flex: 1;
  min-width: 80px;
  color: var(--app-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.empty-text {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
}
</style>
