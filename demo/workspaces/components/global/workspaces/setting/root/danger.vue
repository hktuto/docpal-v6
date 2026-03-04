<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'

const { workspace } = useSingleWorkspaceContext()
const router = useRouter()

async function handleDeleteWorkspace() {
  if (!workspace.value) return

  try {
    await ElMessageBox.confirm(
      'This will permanently delete the workspace and all its contents. Continue?',
      'Warning',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )

    // TODO: Implement workspace deletion
    ElMessage.success('Workspace deleted successfully')
    router.push('/workspaces')
  } catch (error) {
    // User cancelled
  }
}
</script>

<template>
  <el-card class="setting-section danger-section">
    <template #header>
      <div class="card-header">
        <h3>Danger Zone</h3>
      </div>
    </template>
    
    <div class="danger-content">
      <div class="danger-info">
        <h4>Delete Database</h4>
        <p>Once you delete a database, there is no going back. Please be certain.</p>
      </div>
      <el-button type="danger" @click="handleDeleteWorkspace">
        Delete Database
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
