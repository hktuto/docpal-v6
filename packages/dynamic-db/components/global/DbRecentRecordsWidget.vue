<template>
  <DashboardCard
    ref="cardRef"
    :title="displayTitle"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-recent-records-widget">
      <el-skeleton v-if="loading" :rows="3" animated />
      <template v-else-if="records.length > 0">
        <div v-for="record in records" :key="record.id" class="record-item">
          <div class="record-fields">
            <template v-for="field in displayFields" :key="field">
              <span class="field-value">{{ record[field] }}</span>
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
    return fields
  }
  return ['name']
})

async function fetchRecords() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const orderBy: any[] = []
    if (props.setting?.sortField) {
      orderBy.push({
        field: props.setting.sortField,
        order: 'desc'
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
  () => [props.setting?.tableId, props.setting?.limit, props.setting?.sortField],
  () => {
    fetchRecords()
  },
  { immediate: true }
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
.record-item {
  padding: var(--app-space-xs) 0;
  border-bottom: 1px solid var(--app-grey-900);
  &:last-child {
    border-bottom: none;
  }
}
.record-fields {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-xs);
  font-size: var(--app-font-size-s);
}
.field-value {
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
