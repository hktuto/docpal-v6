<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { clientApi, newClientApi } from 'api'

interface TargetOption {
  id: string
  name?: string
  username?: string
}

interface PermissionRow {
  id: string
  targetId: string
  targetName: string
  targetType: number
  permissionLevel: string
  isInherit: boolean
}

const { t } = useI18n()
const currentWorkflowId = ref('')
const dialogVisible = ref(false)
const loading = ref(false)
const permissions = ref<PermissionRow[]>([])

const users = ref<TargetOption[]>([])
const roles = ref<TargetOption[]>([])
const groups = ref<TargetOption[]>([])
const targetsLoading = ref(false)

const selectedTarget = ref('')
const submitting = ref(false)

const selectGroups = computed(() =>
  [
    {
      label: t('user_users'),
      type: 1,
      icon: 'lucide:user',
      options: users.value.filter((u) => !isExistingTarget(1, u.id)).map((u) => ({ value: `1:${u.id}`, label: u.username || u.name || u.id }))
    },
    {
      label: t('user_role'),
      type: 2,
      icon: 'lucide:shield',
      options: roles.value.filter((r) => !isExistingTarget(2, r.id)).map((r) => ({ value: `2:${r.id}`, label: r.name || r.id }))
    },
    {
      label: t('user_groups'),
      type: 3,
      icon: 'lucide:users',
      options: groups.value.filter((g) => !isExistingTarget(3, g.id)).map((g) => ({ value: `3:${g.id}`, label: g.name || g.id }))
    },
    {
      label: t('service'),
      type: 5,
      icon: 'lucide:workflow',
      options: !isExistingTarget(5, 'workflow') ? [{ value: '5:workflow', label: t('workflow') }] : []
    }
  ].filter((g) => g.options.length > 0)
)

function isExistingTarget(targetType: number, targetId: string): boolean {
  return permissions.value.some((item) => item.targetType === targetType && item.targetId === targetId && !item.isInherit)
}

const parsedTarget = computed(() => {
  if (!selectedTarget.value) return null
  const [typeStr, ...idParts] = selectedTarget.value.split(':')
  const type = parseInt(typeStr, 10)
  const id = idParts.join(':')
  let displayName = ''
  if (type === 1) {
    const u = users.value.find((x) => x.id === id)
    displayName = u?.username || u?.name || id
  } else if (type === 2) {
    const r = roles.value.find((x) => x.id === id)
    displayName = r?.name || id
  } else if (type === 3) {
    const g = groups.value.find((x) => x.id === id)
    displayName = g?.name || id
  } else if (type === 5) {
    displayName = t('workflow')
  }
  return { type, id, name: displayName }
})

function getTargetIcon(targetType: number): string {
  switch (targetType) {
    case 1:
      return 'lucide:user'
    case 2:
      return 'lucide:shield'
    case 3:
      return 'lucide:users'
    case 5:
      return 'lucide:workflow'
    default:
      return 'lucide:user'
  }
}

function getTargetLabel(targetType: number): string {
  switch (targetType) {
    case 1:
      return t('user_users')
    case 2:
      return t('user_role')
    case 3:
      return t('user_groups')
    case 5:
      return t('service')
    default:
      return t('user_users')
  }
}

async function loadPermissions() {
  loading.value = true
  try {
    const { data } = await clientApi.instance
      .get(`/v2/acl/resource-permissions/resource/${currentWorkflowId.value}`, {
        baseURL: '/gateway',
        params: {
          resourceType: 3
        }
      })
      .then((res) => res.data)
    permissions.value = (data || []).map((item: any) => ({
      id: item.id,
      targetId: item.targetId,
      targetName: item.targetName || item.targetId,
      targetType: item.targetType ?? 1,
      permissionLevel: item.permissionLevel || 'default',
      isInherit: !!item.isInherit
    }))
  } catch (error) {
    console.error('Failed to load permissions:', error)
    ElMessage.error(t('commons_error'))
  } finally {
    loading.value = false
  }
}

async function loadTargets() {
  targetsLoading.value = true
  try {
    await Promise.all([loadUsers(), loadRoles(), loadGroups()])
  } finally {
    targetsLoading.value = false
  }
}

async function loadUsers() {
  const { data } = await newClientApi.postUcenterGetKeycloakAllUsers()
  users.value = (data || []).map((u: any) => ({
    id: u.userId,
    username: u.username,
    name: u.name || u.email || u.username
  }))
}

async function loadRoles() {
  const { data } = await clientApi.api.postDocpalAclRolePage({
    pageNum: 0,
    pageSize: 1000
  })
  roles.value = (data?.entryList || []).map((r: any) => ({
    id: r.id,
    name: r.name
  }))
}

async function loadGroups() {
  const { data } = await clientApi.admin.postUcenterGroups()
  groups.value = (data || []).map((g: any) => ({
    id: g.id,
    name: g.name
  }))
}

async function handleAddPermission() {
  if (!parsedTarget.value) {
    ElMessage.warning('Please select a target')
    return
  }

  submitting.value = true
  try {
    await clientApi.instance.post(
      '/v2/acl/resource-permissions',
      {
        resourceId: currentWorkflowId.value,
        resourceType: 3,
        targetType: parsedTarget.value.type,
        targetId: parsedTarget.value.id,
        permissionLevel: 'default'
      },
      {
        baseURL: '/gateway'
      }
    )
    ElMessage.success(t('dpMsg_success'))
    selectedTarget.value = ''
    await loadPermissions()
  } catch (error) {
    console.error('Failed to add permission:', error)
    ElMessage.error(t('commons_error'))
  } finally {
    submitting.value = false
  }
}

async function handleRemovePermission(row: PermissionRow) {
  if (row.isInherit) {
    ElMessage.warning('Inherited permissions must be removed at the source.')
    return
  }

  try {
    await ElMessageBox.confirm(`Remove permission for ${row.targetName}?`, 'Confirm', {
      confirmButtonText: 'Remove',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await clientApi.instance.delete(`/v2/acl/resource-permissions/${row.id}`, {
      baseURL: '/gateway'
    })
    ElMessage.success(t('dpMsg_success'))
    await loadPermissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to remove permission:', error)
      ElMessage.error(t('commons_error'))
    }
  }
}

async function open(workflowId: string) {
  if (workflowId) {
    currentWorkflowId.value = workflowId
  }
  selectedTarget.value = ''
  dialogVisible.value = true
  await Promise.all([loadPermissions(), loadTargets()])
}

function close() {
  dialogVisible.value = false
  permissions.value = []
  selectedTarget.value = ''
}

defineExpose({
  open,
  close
})
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="t('workflow_editorPermission')" width="600px" :close-on-click-modal="false" @close="close">
    <div v-loading="loading" class="permission-dialog-content">
      <!-- Add Permission Section -->
      <el-form label-position="top">
        <el-form-item :label="t('rbac.permission.targetName')">
          <div class="add-permission-section">
            <el-select v-model="selectedTarget" placeholder="Search and select user, role, group or service" filterable clearable :loading="targetsLoading">
              <el-option-group v-for="group in selectGroups" :key="group.label" :label="group.label">
                <el-option v-for="opt in group.options" :key="opt.value" :label="opt.label" :value="opt.value">
                  <div class="target-option">
                    <Icon :name="group.icon" class="target-option-icon" />
                    <span>{{ opt.label }}</span>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
            <el-button type="primary" :loading="submitting" :disabled="!selectedTarget" @click="handleAddPermission">
              {{ t('rbac.permission.addPermission') }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <el-divider />

      <!-- Permissions List -->
      <div class="permissions-list">
        <h4>Permission List</h4>
        <el-table :data="permissions" style="width: 100%" empty-text="No permissions">
          <el-table-column :label="t('rbac.permission.targetName')" min-width="200">
            <template #default="{ row }">
              <div class="user-cell">
                <Icon :name="getTargetIcon(row.targetType)" class="user-icon" />
                <div class="user-info">
                  <span class="user-name">{{ row.targetName }}</span>
                  <el-tag size="small" type="info" effect="plain" class="type-tag">
                    {{ getTargetLabel(row.targetType) }}
                  </el-tag>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="t('rbac.permission.permissionLevel')" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="primary">{{ row.permissionLevel }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Actions" align="center" width="100">
            <template #default="{ row }">
              <el-button size="small" type="danger" plain :disabled="row.isInherit" @click="handleRemovePermission(row)">
                {{ t('common_delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">Close</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.permission-dialog-content {
  max-height: 60vh;
  overflow-y: auto;
}

.add-permission-section {
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.permissions-list {
  h4 {
    margin: 0 0 var(--app-space-s);
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.target-option {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}

.target-option-icon {
  font-size: 16px;
  color: var(--app-grey-500);
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

.type-tag {
  width: fit-content;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-s);
}
</style>
