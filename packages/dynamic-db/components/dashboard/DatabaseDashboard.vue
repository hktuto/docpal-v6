<template>
  <div class="database-dashboard" v-loading="loading">
    <DashboardDetail
      v-if="layout"
      v-model:layout="layout"
      :resizable="editMode"
      :draggable="editMode"
      :hide-setting="!editMode"
      :edit-mode="editMode"
      :dashboard-setting-list="dbWidgetRegistryByType"
      @add="handleAdd"
      @save="handleSave"
      @delete="handleDelete"
      @refreshSetting="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { getDbDashboardWidgetByType } from '#imports'
import type { DatabaseDashboardLayoutItem } from '../../composables/dashboard/useDatabaseDashboard'
import { useDatabaseDashboard } from '../../composables/dashboard/useDatabaseDashboard'
const props = defineProps<{
  editMode: boolean
  menuItem: any
}>()

const emit = defineEmits(['save'])

const dbWidgetRegistryByType = computed(() => getDbDashboardWidgetByType())

const { layout, loading, saveLayout } = useDatabaseDashboard(computed(() => props.menuItem))

async function handleAdd(data: any) {
  const timestamp = Date.now().toString()
  const newItem: DatabaseDashboardLayoutItem = {
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
  await saveLayout()
}

async function handleDelete(i: string) {
  const index = layout.value.findIndex((item) => item.i === i)
  if (index !== -1) {
    layout.value.splice(index, 1)
    await saveLayout()
  }
}

async function handleRefresh(row: any) {
  const index = layout.value.findIndex((item) => item.i === row.i)
  if (index !== -1) {
    layout.value[index] = { ...layout.value[index], ...row }
    await saveLayout()
  }
}

async function handleSave() {
  await saveLayout()
  emit('save')
}

defineExpose({ saveLayout })
</script>

<style scoped lang="scss">
.database-dashboard {
  height: 100%;
  overflow: hidden;
}
</style>
