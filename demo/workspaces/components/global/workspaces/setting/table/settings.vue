<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleWorkspaceContext } from '../../../../../composables/workspace/useSingleWorkspace'

const { workspaceRouteParams, deleteItem } = useSingleWorkspaceContext()

async function handleDeleteTable() {
  if (!workspaceRouteParams.value.detailId) return

  try {
    await ElMessageBox.confirm(
      'This will permanently delete the table and all its data. Continue?',
      'Warning',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    await deleteItem(workspaceRouteParams.value.detailId)
    ElMessage.success('Table deleted successfully')
  } catch (error) {
    // User cancelled or error occurred
  }
}
</script>

<template>
  <el-card class="setting-section danger-section">
    <template #header>
      <div class="card-header">
        <h3>Settings</h3>
      </div>
    </template>
    
    <div class="danger-content">
      <div class="danger-info">
        <h4>Delete Table</h4>
        <p>Once you delete a table, there is no going back. All data will be permanently removed.</p>
      </div>
      <el-button type="danger" @click="handleDeleteTable">
        Delete Table
      </el-button>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }
}

.danger-section {
  border: 1px solid var(--el-color-danger);

  .danger-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--app-space-m);

    .danger-info {
      flex: 1;

      h4 {
        margin: 0 0 var(--app-space-xs) 0;
        font-size: var(--app-font-size-m);
        font-weight: 600;
        color: var(--el-color-danger);
      }

      p {
        margin: 0;
        color: var(--app-grey-600);
        font-size: var(--app-font-size-s);
      }
    }
  }
}
</style>
