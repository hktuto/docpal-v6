<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleDatabaseContext } from '../../../../../composables/useSignleDatabase'
import AddDatabasePermissionDialog from '../../../../database/permission/AddDatabasePermissionDialog.vue'

const { database } = useSingleDatabaseContext()

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

type PermissionLevel = 'Member' | 'Manage'

interface PermissionRow {
  id: string
  targetId: string
  targetName: string
  targetType: number        // 1 = user, 2 = role, 3 = group
  permissionLevel: PermissionLevel
  permissionIds: number[]
  isInherit: boolean
  inheritFrom: string
  loading: boolean
}

const permissionState = reactive({
  loading: false,
  tableData: [] as PermissionRow[]
})

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
  // TODO: populate user/role/group lists before opening
  // await loadUsers()
  // await loadRoles()
  // await loadGroups()
  //
  // addPermissionDialogRef.value.users.value = usersFromApi
  // addPermissionDialogRef.value.roles.value = rolesFromApi
  // addPermissionDialogRef.value.groups.value = groupsFromApi

  addPermissionDialogRef.value?.open()
}

function handleDialogSubmit(data: {
  targetType: number
  targetId: string
  targetName: string
  permissionLevel: 'Member' | 'Manage'
  permissionIds: number[]
}) {
  // TODO: call create permission API
  console.log('Create permission payload:', data)

  // After successful creation, refresh the list
  // getPermissions()
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

    // TODO: call delete API
    // const index = permissionState.tableData.indexOf(row)
    // if (index > -1) permissionState.tableData.splice(index, 1)

    ElMessage.success('Permission removed successfully')
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

    // TODO: call update API with payload
    console.log('Update permission payload:', payload)

    // Optimistically update local state
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

async function getPermissions() {
  permissionState.loading = true
  try {
    const { data } = await clientApi.instance.get(
      `/v2/acl/resource-permissions/resource/${database.value.id}?resourceType=2`,
      { baseURL: '/gateway' }
    ).then(res => res.data)
    permissionState.tableData = data.map((item: any) => ({
      id: item.id,
      targetId: item.targetId,
      targetName: item.targetName || item.targetId,
      targetType: item.targetType ?? 1,
      permissionLevel: item.permissionLevel === 'Manage' ? 'Manage' : 'Member',
      permissionIds: item.permissionIds || [],
      isInherit: !!item.isInherit,
      inheritFrom: item.inheritFrom || '-',
      loading: false
    }))
  } catch (error) {
    console.error('Failed to load permissions:', error)
    ElMessage.error('Failed to load permissions')
  } finally {
    permissionState.loading = false
  }
}

onMounted(() => {
  getPermissions()
})
</script>

<template>
  <el-card class="setting-section" v-loading="permissionState.loading">
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
      <el-table :data="permissionState.tableData" style="width: 100%">
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
              :disabled="row.isInherit || row.loading"
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
              :disabled="row.isInherit"
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
