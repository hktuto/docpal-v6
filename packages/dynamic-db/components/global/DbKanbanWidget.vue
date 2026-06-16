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
    <div class="db-kanban-widget">
      <el-skeleton v-if="loading" :rows="3" animated />
      <template v-else>
        <div class="kanban-board">
          <div
            v-for="col in columns"
            :key="col.id"
            class="kanban-column"
          >
            <div class="kanban-header" :style="{ backgroundColor: col.color + '20', borderColor: col.color }">
              <span class="kanban-dot" :style="{ backgroundColor: col.color }" />
              <span class="kanban-title">{{ col.label }}</span>
              <span class="kanban-count">{{ col.items.length }}</span>
            </div>
            <div class="kanban-cards">
              <div
                v-for="item in col.items"
                :key="item.id"
                class="kanban-card"
                @click="handleCardClick(item)"
              >
                <span class="card-title">{{ item.title || 'Untitled' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </DashboardCard>
  <DbKanbanWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { postDynamicActions } from 'api'
import { useTableFields } from '../../composables/dashboard/useTableFields'
import { useDashboardLiveUpdate } from '../../composables/dashboard/useDashboardLiveUpdate'
import { SingleDatabaseContextKey } from '../../composables/useSignleDatabase'

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

const displayTitle = computed(() => props.setting?.label || 'Kanban')

const groupField = computed(() => props.setting?.groupField || '')
const titleField = computed(() => props.setting?.titleField || '')

const fieldMetaMap = ref<Record<string, any>>({})
const { getFields } = useTableFields()

async function loadFieldMeta(tableId: string) {
  if (!tableId) {
    fieldMetaMap.value = {}
    return
  }
  const fields = await getFields(tableId)
  const map: Record<string, any> = {}
  for (const f of fields) {
    map[f.field_name] = f
  }
  fieldMetaMap.value = map
}

const columns = computed(() => {
  const gField = groupField.value
  const tField = titleField.value || 'name'
  const fieldMeta = fieldMetaMap.value[gField]
  const options = fieldMeta?.display_structure?.options || fieldMeta?.properties?.options || []

  const optionMap = new Map<string, { id: string; label: string; color: string; items: any[] }>()

  for (const opt of options) {
    optionMap.set(opt.id, {
      id: opt.id,
      label: opt.label || opt.name || opt.id,
      color: opt.color || '#909399',
      items: []
    })
  }

  // Add uncategorized bucket
  optionMap.set('__uncategorized', {
    id: '__uncategorized',
    label: 'Uncategorized',
    color: '#909399',
    items: []
  })

  for (const row of records.value) {
    const groupVal = row[gField]
    const groupId = groupVal ?? '__uncategorized'
    const bucket = optionMap.get(groupId) || optionMap.get('__uncategorized')!
    bucket.items.push({
      id: row.id,
      title: row[tField],
      raw: row
    })
  }

  return Array.from(optionMap.values()).filter((c) => c.id === '__uncategorized' ? c.items.length > 0 : true)
})

const dbContext = inject(SingleDatabaseContextKey, null)

function handleCardClick(item: any) {
  if (!dbContext || !props.setting?.tableId || !item.id) return
  dbContext.databaseMenuRouteParams.value.detailType = 'record'
  dbContext.databaseMenuRouteParams.value.recordId = item.id
  dbContext.databaseMenuRouteParams.value.tableId = props.setting.tableId
  dbContext.databaseMenuRouteParams.value.pageType = 'detail'
}

async function fetchData() {
  const { tableId, limit } = props.setting || {}
  if (!tableId || !groupField.value) return
  loading.value = true
  try {
    const { data }: any = await postDynamicActions({
      tableId,
      columns: [{ name: '*' }],
      pagination: {
        pageSize: limit || 100,
        pageNum: 1
      }
    })
    records.value = data?.data || []
  } catch (error) {
    console.error('Failed to fetch kanban data:', error)
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
  () => [props.setting?.tableId, props.setting?.groupField, props.setting?.titleField, props.setting?.limit],
  () => {
    fetchData()
  },
  { immediate: true }
)

useDashboardLiveUpdate(
  computed(() => props.setting?.tableId),
  fetchData
)

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-kanban-widget {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
.kanban-board {
  display: flex;
  gap: var(--app-space-s);
  height: 100%;
  padding: var(--app-space-xs);
}
.kanban-column {
  flex: 1;
  min-width: 200px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  background-color: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-m);
}
.kanban-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--app-space-xs) var(--app-space-s);
  border-bottom: 2px solid;
  font-weight: 600;
  font-size: var(--app-font-size-s);
}
.kanban-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.kanban-title {
  flex: 1;
}
.kanban-count {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-secondary);
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 10px;
}
.kanban-cards {
  flex: 1;
  overflow-y: auto;
  padding: var(--app-space-xs);
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}
.kanban-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--app-border-radius-s);
  padding: var(--app-space-s);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}
.card-title {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color);
}
</style>
