<template>
  <DashboardCard
    ref="cardRef"
    :title="displayLabel"
    :subtitle="props.setting?.subtitle"
    :footer="props.setting?.footer"
    :hide-setting="hideSetting"
    :setting="setting"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-count-widget">
      <div v-if="!hideSetting && !setting?.tableId" class="widget-config">
        <el-select
          v-model="selectedTableId"
          placeholder="Select a table"
          size="small"
          style="width: 100%"
          @change="handleTableChange"
        >
          <el-option
            v-for="table in tableOptions"
            :key="table.item_id"
            :label="table.name"
            :value="table.item_id"
          />
        </el-select>
      </div>
      <div v-else class="count-value" :style="{ color: countColor }">
        {{ count }}
      </div>
    </div>
  </DashboardCard>
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

const { menuState } = useSingleDatabaseContext()

const count = ref(0)
const loading = ref(false)
const selectedTableId = ref(props.setting?.tableId || '')

const displayLabel = computed(() => props.setting?.label || 'Records')

const tableOptions = computed(() => {
  const items = menuState.value.items || []
  const tables: any[] = []
  function collectTables(items: any[]) {
    for (const item of items) {
      if (item.item_type === 'master_table' && item.item_id) {
        tables.push(item)
      }
      if (item.children?.length) {
        collectTables(item.children)
      }
    }
  }
  collectTables(items)
  return tables
})

const countColor = computed(() => {
  const colorMap: Record<string, string> = {
    primary: 'var(--el-color-primary)',
    success: 'var(--el-color-success)',
    warning: 'var(--el-color-warning)',
    danger: 'var(--el-color-danger)'
  }
  return colorMap[props.setting?.color] || 'var(--el-color-primary)'
})

async function fetchCount() {
  if (!props.setting?.tableId) return
  loading.value = true
  try {
    const { data }: any = await postDynamicActions({
      tableId: props.setting.tableId,
      columns: [],
      pagination: {
        pageSize: 1,
        pageNum: 1
      }
    })
    count.value = data?.meta?.total || 0
  } catch (error) {
    console.error('Failed to fetch count:', error)
    count.value = 0
  } finally {
    loading.value = false
  }
}

function handleTableChange(tableId: string) {
  emit('refreshSetting', {
    ...props.setting,
    tableId
  })
}

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

watch(
  () => props.setting?.tableId,
  () => {
    selectedTableId.value = props.setting?.tableId || ''
    fetchCount()
  },
  { immediate: true }
)

const cardRef = ref()

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-count-widget {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--app-space-s);
}
.widget-config {
  width: 80%;
}
.count-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}
</style>
