<script lang="ts" setup>
import { newClientApi } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useSingleDatabaseContext } from '../../../../../composables/useSignleDatabase'
import { useUserId } from '../../../../../../authApp/composables/useAuth'
import AddDatabaseMenuPermissionDialog from '../../../../database/permission/AddDatabaseMenuPermissionDialog.vue'
import type { MenuItemPermissionRow, MenuItemPermissionLevel } from '../../../../../composables/useSignleDatabase'

const props = defineProps<{
  id: string
}>()

const {
  database,
  permissions,
  menuItemPermissions,
  menuItemPermissionsLoading,
  getMenuItemPermissions,
  getPermissions
} = useSingleDatabaseContext()
const currentUserId = useUserId()

function isCurrentUser(row: MenuItemPermissionRow): boolean {
  return row.targetType === 1 && row.targetId === currentUserId.value
}

/* ─── Permission ID reference ───
 * 50 : menu-item:view  (View)
 * 51 : menu-item:edit  (Edit)
 * 52 : menu-item:update (Edit)
 * 53 : menu-item:manage (Manage)
 * 54 : menu-item:delete (Manage)
 * 61 : menu-item:member-manage (Manage)
 */
const PERMISSION_IDS = {
  View: [50],
  Edit: [51, 52],
  Manage: [53, 54, 61]
} as const

const addPermissionDialogRef = ref()

const mergedPermissions = computed<MenuItemPermissionRow[]>(() => {
  const groups = new Map<string, MenuItemPermissionRow[]>()

  menuItemPermissions.value.forEach((p) => {
    const key = `${p.targetType}:${p.targetId}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(p)
  })

  return Array.from(groups.values()).map((items) => {
    const direct = items.find((p) => !p.isInherit)
    if (direct) return direct

    // All inherited — merge them
    const first = items[0]
    const levels = items.map((p) => p.permissionLevel)
    const highestLevel = levels.includes('Manage')
      ? 'Manage'
      : levels.includes('Edit')
        ? 'Edit'
        : 'View'
    const sources = [...new Set(items.map((p) => p.inheritFrom).filter((s) => s && s !== '-'))]

    return {
      ...first,
      permissionLevel: highestLevel,
      permissionIds: [...PERMISSION_IDS[highestLevel]],
      inheritFrom: sources.length ? sources.join(', ') : first.inheritFrom
    }
  })
})

const displayPermissions = computed<MenuItemPermissionRow[]>(() => {
  return mergedPermissions.value
})

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
  permissionLevel: MenuItemPermissionLevel
}) {
  // If the target is not already a database member, add them as Member first
  const alreadyMember = permissions.value.some(
    (p) => p.targetType === data.targetType && p.targetId === data.targetId
  )
  if (!alreadyMember && database.value?.id) {
    await newClientApi.postDynamicDbPermissionsDatabaseDatabaseidGrant(database.value.id, {
      targetType: data.targetType,
      targetId: data.targetId,
      permissionLevel: 'Member'
    })
    await getPermissions()
  }

  await newClientApi.postDynamicDbPermissionsMenuMenuidGrant(props.id, {
    targetType: data.targetType,
    targetId: data.targetId,
    permissionLevel: data.permissionLevel
  })
  await getMenuItemPermissions(props.id)
}

async function handleRemovePermission(row: MenuItemPermissionRow) {
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
    await newClientApi.deleteDynamicDbPermissionsMenuMenuidRevokePermissionid(props.id, row.id)
    ElMessage.success('Permission removed successfully')
    await getMenuItemPermissions(props.id)
  } catch {
    // User cancelled
  }
}

async function handlePermissionChange(level: MenuItemPermissionLevel, row: MenuItemPermissionRow) {
  if (row.isInherit) return
  if (row.permissionLevel === level) return

  row.loading = true
  try {
    const { data }: any = await newClientApi.putDynamicDbPermissionsMenuMenuidUpdatePermissionPermissionid(props.id, row.id, {
      permissionLevel: level
    })
    console.log('update response', data)
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

// Load permissions on mount and when id changes
onMounted(() => {
  if (props.id) {
    getMenuItemPermissions(props.id)
  }
})

watch(() => props.id, (newId) => {
  if (newId) {
    getMenuItemPermissions(newId)
  }
})
</script>

<template>
  <el-card class="setting-section" v-loading="menuItemPermissionsLoading">
    <template #header>
      <div class="card-header">
        <h3>Permissions</h3>
        <el-button type="primary" size="small" @click="handleAddPermission">
          Add User / Role / Group
        </el-button>
      </div>
    </template>

    <div class="description">
      Manage who can access this menu item. Viewers can see content; Editors can modify content; Managers have full control.
    </div>

    <div class="table-container">
      <el-table :data="mergedPermissions" style="width: 100%">
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

        <el-table-column label="Permission Level" min-width="280">
          <template #default="{ row }">
            <el-radio-group
              v-model="row.permissionLevel"
              size="small"
              :disabled="row.isInherit || row.loading || isCurrentUser(row)"
              @change="(level: any) => handlePermissionChange(level, row)"
            >
              <el-radio-button label="View">View</el-radio-button>
              <el-radio-button label="Edit">Edit</el-radio-button>
              <el-radio-button label="Manage">Manage</el-radio-button>
            </el-radio-group>
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

  <AddDatabaseMenuPermissionDialog
    ref="addPermissionDialogRef"
    :exist-list="displayPermissions"
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
