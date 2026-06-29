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
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ViewDashboardLayoutItem } from '../../utils/databaseType'
import { getDbDashboardWidgetByType } from '../../utils/dashboardWidgets'
import { useTableViewsInject } from '../../composables/table/useTableViews'

const { t } = useI18n()

defineProps<{
  // TODO: pass to record-aware widgets in the widget phase
  recordId?: string | number
  // TODO: wire into widget context in the widget phase
  tableId?: string
  canManage?: boolean
}>()

const { currentView, updateView } = useTableViewsInject()

const editMode = ref(false)
const saving = ref(false)

const initialLayout = computed(() => {
  return currentView.value?.dashboard?.layout ?? []
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
  // For now expose the same widget palette as the database dashboard.
  // Widgets will be made record-aware in the next step.
  return getDbDashboardWidgetByType()
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
    setting: data.setting ? { ...data.setting } : undefined
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
