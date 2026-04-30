<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleDatabaseContext } from '../../../../../composables/useSignleDatabase'
import { useUserId } from '../../../../../../authApp/composables/useAuth'
import AddDatabasePermissionDialog from '../../../../database/permission/AddDatabasePermissionDialog.vue'
import type { PermissionRow, PermissionLevel } from '../../../../../composables/useSignleDatabase'

const { database, permissions, permissionsLoading, getPermissions } = useSingleDatabaseContext()
const currentUserId = useUserId()

function isCurrentUser(row: PermissionRow): boolean {
  return row.targetType === 1 && row.targetId === currentUserId.value
}

/* ─── Permission ID reference ───
 * 47 : database:read   (Member)
 * 48 : database:manage (Manage)
 * 49 : member:manage   (Manage)
 *
 * Database level has 2 roles:
 *   Member → can access & view
 *   Manage → can update settings & manage members
 */

const PERMISSION_IDS = {
  Member: [47],
  Manage: [47, 48, 49]
} as const

const addPermissionDialogRef = ref()

function getTargetIcon(targetType: number): string {
  switch (targetType) {
    case 1: return 'lucide:user'
    case 2: return 'lucide:shield'
    case 3: return 'lucide:users'
    default: return 'lucide:user'
  }
}

function getTargetLabel(targetType: number): string {
  switch (targetType) {
    case 1: return 'User'
    case 2: return 'Role'
    case 3: return 'Group'
    default: return 'User'
  }
}

async function handleAddPermission() {
  addPermissionDialogRef.value?.open()
}

async function handleDialogSubmit(data: {
  targetType: number
  targetId: string
  targetName: string
  permissionLevel: PermissionLevel
  permissionIds: number[]
}) {
  console.log('Create permission payload:', data)
  const response = await clientApi.instance.post('/v2/acl/resource-permissions', {
    ...data,
    resourceId: database.value.id,
    resourceType: 2
  }, {
    baseURL: '/gateway',
  })
  console.log('handleDialogSubmit', response)
  await getPermissions()
}

async function handleRemovePermission(row: PermissionRow) {
  if (row.isInherit) {
    ElMessage.warning('Inherited permissions must be removed at the source.')
    return
  }

  try {
    await ElMessageBox.confirm(
      `Remove permission for ${row.targetName || row.targetId}?`,
      'Confirm',
      {
        confirmButtonText: 'Remove',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }
    )
    await clientApi.instance.delete('/v2/acl/resource-permissions/' + row.id, {
      baseURL: '/gateway'
    })
    ElMessage.success('Permission removed successfully')
    await getPermissions()
  } catch {
    // User cancelled
  }
}

async function handlePermissionChange(level: PermissionLevel, row: PermissionRow) {
  if (row.isInherit) return
  if (row.permissionLevel === level) return

  row.loading = true
  try {
    const payload = {
      id: row.id,
      resourceId: database.value.id,
      resourceType: 2,
      targetType: row.targetType,
      targetId: row.targetId,
      permissionLevel: level,
      permissionIds: PERMISSION_IDS[level]
    }

    const response = await clientApi.instance.put('/v2/acl/resource-permissions/' + row.id, payload, {
      baseURL: '/gateway'
    })
    console.log('update response', response)
    row.permissionLevel = level
    row.permissionIds = [...PERMISSION_IDS[level]]

    ElMessage.success('Permission updated successfully')
  } catch (error) {
    console.error('Error updating permission:', error)
    ElMessage.error('Failed to update permission')
  } finally {
    row.loading = false
  }
}
</script>

<template>
  <el-card class="setting-section" v-loading="permissionsLoading">
    <template #header>
      <div class="card-header">
        <h3>Permissions</h3>
        <el-button type="primary" size="small" @click="handleAddPermission">
          Add User / Role / Group
        </el-button>
      </div>
    </template>

    <div class="description">
      Manage who can access this database. Members can view content; Managers can change settings and manage members.
    </div>

    <div class="table-container">
      <el-table :data="permissions" style="width: 100%">
        <el-table-column label="Target" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <Icon
                :name="getTargetIcon(row.targetType)"
                class="user-icon"
              />
              <div class="user-info">
                <span class="user-name">{{ row.targetName }}</span>
                <div class="target-meta">
                  <el-tag size="small" type="info" effect="plain" class="type-tag">
                    {{ getTargetLabel(row.targetType) }}
                  </el-tag>
                  <el-tag
                    v-if="row.isInherit"
                    size="small"
                    type="warning"
                    effect="plain"
                    class="inherit-tag"
                  >
                    Inherited
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Permission Level" min-width="220">
          <template #default="{ row }">
            <el-radio-group
              v-model="row.permissionLevel"
              size="small"
              :disabled="row.isInherit || row.loading || isCurrentUser(row)"
              @change="(level: any) => handlePermissionChange(level, row)"
            >
              <el-radio-button label="Member">Member</el-radio-button>
              <el-radio-button label="Manage">Manage</el-radio-button>
            </el-radio-group>
          </template>
        </el-table-column>

        <el-table-column label="Source" width="160">
          <template #default="{ row }">
            <el-tag
              v-if="row.isInherit"
              size="small"
              type="warning"
              effect="light"
            >
              {{ row.inheritFrom }}
            </el-tag>
            <el-tag v-else size="small" type="success" effect="light">
              Direct
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Actions" align="center" width="120">
          <template #default="{ row }">
            <el-button
              size="small"
              type="danger"
              plain
              :loading="row.loading"
              :disabled="row.isInherit || isCurrentUser(row)"
              @click="handleRemovePermission(row)"
            >
              Remove
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </el-card>

  <AddDatabasePermissionDialog
    ref="addPermissionDialogRef"
    :exist-list="permissions"
    @submit="handleDialogSubmit"
  />
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

.user-icon {
  font-size: 18px;
  color: var(--app-grey-500);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 500;
}

.target-meta {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.type-tag,
.inherit-tag {
  width: fit-content;
}
</style>
