<script setup lang="ts">
const props = defineProps<{
  isAdmin: boolean
}>()

const { databaseMenuRouteParams, menuState, findItemById, checkMenuItemPermission, openSetting } = useSingleDatabaseContext()

const currentMenuItem = computed(() => {
  if (!databaseMenuRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId as string)
})

const canManage = computed(() => {
  if (!databaseMenuRouteParams.value.detailId) return false
  return checkMenuItemPermission(databaseMenuRouteParams.value.detailId, 'Manage')
})

function handleEdit() {
  if (!currentMenuItem.value?.id) return
  openSetting(currentMenuItem.value.id, 'dashboard')
}
</script>

<template>
  <div class="db-dashboard-detail">
    <Teleport to="#database-table-header-right">
      <el-button v-if="canManage" size="small" @click="handleEdit">
        <Icon name="lucide:pencil" size="14" />
        Edit
      </el-button>
    </Teleport>
    <DashboardDatabaseDashboard
      v-if="currentMenuItem"
      :edit-mode="false"
      :menu-item="currentMenuItem"
    />
    <div v-else class="empty-state">
      <p>Dashboard not found</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.db-dashboard-detail {
  height: 100%;
  overflow: hidden;
}
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--app-text-color-secondary);
}
</style>
