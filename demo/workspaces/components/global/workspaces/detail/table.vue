<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

const { workspaceRouteParams, workspace, menuState, findItemById, deleteItem, navigateToItem } = useSingleWorkspaceContext()

const currentTable = ref<any>(null)

function getCurrentTable() {
  if (!workspaceRouteParams.value.detailId) return null
  return findItemById(menuState.value.items, workspaceRouteParams.value.detailId as string)
}

function checkTableStatus() {
  const table = getCurrentTable()
  currentTable.value = table
}

async function handleDeleteTable() {
  if (!currentTable.value) return
  
  try {
    await ElMessageBox.confirm(
      'This will delete this table and all its data. Are you sure?',
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
    
    <template v-else-if="!currentTable.item_id">
      <!-- Table not properly created - show error state -->
      <div class="error-state">
        <Icon name="material-symbols:error-outline" class="error-icon" />
        <h3>Table Not Found</h3>
        <p>This table was not created properly.</p>
        <el-button type="danger" @click="handleDeleteTable">
          Delete and try again
        </el-button>
      </div>
    </template>
    
    <template v-else>
      <!-- Table Detail View -->
      <WorkspacesTableView
        :menu-item="currentTable"
        :data-table-id="currentTable.item_id"
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

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--el-text-color-secondary);
  text-align: center;
  
  .error-icon {
    font-size: 64px;
    color: var(--el-color-danger);
  }
  
  h3 {
    margin: 0;
    color: var(--el-text-color-primary);
  }
  
  p {
    margin: 0;
  }
}
</style>
