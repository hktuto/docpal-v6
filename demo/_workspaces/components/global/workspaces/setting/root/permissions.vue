<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'

const permissionState = reactive({
  loading: false,
  tableData: [] as any[]
})

const addPermissionDialogRef = ref()

function handleAddPermission() {
  addPermissionDialogRef.value?.open()
}

async function handleRemovePermission(row: any) {
  try {
    await ElMessageBox.confirm(
      `Remove permission for ${row.userId}?`,
      'Confirm',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )

    const index = permissionState.tableData.indexOf(row)
    if (index > -1) {
      permissionState.tableData.splice(index, 1)
    }
    ElMessage.success('Permission removed successfully')
  } catch (error) {
    // User cancelled
  }
}

async function handlePermissionChange(value: boolean, permission: string, row: any) {
  row.loading = true
  try {
    // TODO: Implement permission change API call
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success(`Permission updated successfully`)
  } catch (error) {
    console.error('Error updating permission:', error)
    ElMessage.error('Failed to update permission')
    row[permission] = !value
  } finally {
    row.loading = false
  }
}

onMounted(() => {
  // TODO: Load permissions from database
  permissionState.tableData = [
    { userId: 'user1@example.com', type: 'user', read: true, write: true, manage: false, loading: false },
    { userId: 'Admin Group', type: 'group', read: true, write: true, manage: true, loading: false }
  ]
})
</script>

<template>
  <el-card class="setting-section" v-loading="permissionState.loading">
    <template #header>
      <div class="card-header">
        <h3>Permissions</h3>
        <el-button type="primary" size="small" @click="handleAddPermission">
          Add User / Group
        </el-button>
      </div>
    </template>
    
    <div class="description">
      Manage who can access this database
    </div>

    <div class="table-container">
      <el-table :data="permissionState.tableData" style="width: 100%">
        <el-table-column prop="userId" label="User / Group" min-width="200">
          <template #default="{ row }">
            <div class="user-cell">
              <Icon :name="row.type === 'user' ? 'lucide:user' : 'lucide:users'" />
              <span>{{ row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="Read" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.read"
              :loading="row.loading"
              :disabled="true"
              @change="(value: boolean) => handlePermissionChange(value, 'read', row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Write" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.write"
              :loading="row.loading"
              @change="(value: boolean) => handlePermissionChange(value, 'write', row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Manage" align="center" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.manage"
              :loading="row.loading"
              @change="(value: boolean) => handlePermissionChange(value, 'manage', row)"
            />
          </template>
        </el-table-column>

        <el-table-column label="Actions" align="center" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              :loading="row.loading"
              @click="handleRemovePermission(row)"
            >
              Remove
            </el-button>
          </template>
        </el-table-column>
      </el-table>
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

  .description {
    color: var(--app-grey-500);
    font-size: var(--app-font-size-s);
    margin-bottom: var(--app-space-m);
  }
}

.table-container {
  margin-top: var(--app-space-m);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
