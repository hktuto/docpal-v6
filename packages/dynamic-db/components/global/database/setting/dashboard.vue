<script setup lang="ts">
const { databaseMenuRouteParams, menuState, findItemById } = useSingleDatabaseContext()

const currentMenuItem = computed(() => {
  if (!databaseMenuRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, databaseMenuRouteParams.value.detailId as string)
})

function handleDone() {
  databaseMenuRouteParams.value.pageType = 'detail'
}
</script>

<template>
  <div class="db-dashboard-setting">
    <Teleport to="#database-table-header-right">
      <el-button type="primary" size="small" @click="handleDone">
        <Icon name="lucide:check" size="14" />
        Done
      </el-button>
    </Teleport>
    <DashboardDatabaseDashboard
      v-if="currentMenuItem"
      :edit-mode="true"
      :menu-item="currentMenuItem"
    />
    <div v-else class="empty-state">
      <p>Dashboard not found</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.db-dashboard-setting {
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
