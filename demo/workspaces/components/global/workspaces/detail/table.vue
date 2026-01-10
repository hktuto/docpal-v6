<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

const { workspaceRouteParams, workspace, menuState, findItemById, deleteItem, navigateToItem } = useSingleWorkspaceContext()

const currentTable = ref<any>(null)
const isTableCreated = ref(false)

function getCurrentTable() {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
}

function checkTableStatus() {
  const table = getCurrentTable()
  currentTable.value = table
  isTableCreated.value = !!(table?.itemId)
}

async function handleSetupComplete(data: { dataTableId: string }) {
  // Refresh the current table state
  checkTableStatus()
  ElMessage.success('Table created successfully!')
}

async function handleDeleteTable() {
  if (!currentTable.value) return
  
  try {
    await ElMessageBox.confirm(
      'This will delete this table from the menu. Are you sure?',
      'Delete Table',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    
    await deleteItem(currentTable.value.id)
    navigateToItem() // Navigate to root
    ElMessage.success('Table deleted successfully')
  } catch (e) {
    // User cancelled
  }
}

onMounted(() => {
  checkTableStatus()
})

watch(() => workspaceRouteParams.value.detailId, () => {
  checkTableStatus()
})
</script>

<template>
  <div class="detailContainer">
    <template v-if="!currentTable">
      <div class="loading-state">
        <el-icon class="is-loading">
          <Icon name="material-symbols:progress-activity" />
        </el-icon>
        <span>Loading table...</span>
      </div>
    </template>
    
    <template v-else-if="!isTableCreated">
      <!-- Setup Wizard -->
      <WorkspacesTableSetupWizard
        :menu-item="currentTable"
        :workspace-id="workspace?.id || ''"
        @complete="handleSetupComplete"
        @delete="handleDeleteTable"
      />
    </template>
    
    <template v-else>
      <!-- Table Detail View -->
      <WorkspacesTableDetailView
        :menu-item="currentTable"
        :data-table-id="currentTable.itemId"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
.detailContainer {
  margin: 0 auto;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 32px;
  }
}
</style>
