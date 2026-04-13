<script lang="ts" setup>
import type { View, SharedWith, SharePermission } from '../../types/database'
import { useDatabase } from '../../composables/useDatabase'
import { Delete, Search, Link, User, UserFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue: boolean
  view: View | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'share': [target: Omit<SharedWith, 'sharedAt' | 'sharedBy'>]
  'remove': [targetType: 'user' | 'group' | 'role', targetId: string]
}>()

const { getUsers, getGroups, getRoles } = useDatabase()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Search query
const searchQuery = ref('')

// Selected permission for new shares
const selectedPermission = ref<SharePermission>('view')

// Get all users, groups, roles
const users = computed(() => getUsers())
const groups = computed(() => getGroups())
const roles = computed(() => getRoles())

// Filter and combine search results
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  
  const query = searchQuery.value.toLowerCase()
  const results: Array<{ type: 'user' | 'group' | 'role'; id: string; name: string; email?: string }> = []
  
  // Search users
  for (const user of users.value) {
    if (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    ) {
      // Check if already shared
      const alreadyShared = props.view?.sharedWith?.some(
        s => s.type === 'user' && s.id === user.id
      )
      if (!alreadyShared) {
        results.push({ type: 'user', id: user.id, name: user.name, email: user.email })
      }
    }
  }
  
  // Search groups
  for (const group of groups.value) {
    if (group.name.toLowerCase().includes(query)) {
      const alreadyShared = props.view?.sharedWith?.some(
        s => s.type === 'group' && s.id === group.id
      )
      if (!alreadyShared) {
        results.push({ type: 'group', id: group.id, name: group.name })
      }
    }
  }
  
  // Search roles
  for (const role of roles.value) {
    if (role.name.toLowerCase().includes(query)) {
      const alreadyShared = props.view?.sharedWith?.some(
        s => s.type === 'role' && s.id === role.id
      )
      if (!alreadyShared) {
        results.push({ type: 'role', id: role.id, name: role.name })
      }
    }
  }
  
  return results.slice(0, 10) // Limit to 10 results
})

// Handle selecting a search result
function handleSelectResult(result: { type: 'user' | 'group' | 'role'; id: string; name: string }) {
  emit('share', {
    type: result.type,
    id: result.id,
    name: result.name,
    permission: selectedPermission.value
  })
  searchQuery.value = ''
  ElMessage.success(`Shared with ${result.name}`)
}

// Handle removing a share
function handleRemoveShare(share: SharedWith) {
  emit('remove', share.type, share.id)
  ElMessage.success(`Removed ${share.name} from sharing`)
}

// Handle permission change for existing share
function handlePermissionChange(share: SharedWith, permission: SharePermission) {
  // Re-emit share with new permission
  emit('share', {
    type: share.type,
    id: share.id,
    name: share.name,
    permission
  })
}

// Copy link to clipboard
function handleCopyLink() {
  const link = `${window.location.origin}/database/view/${props.view?.id}`
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('Link copied to clipboard')
  }).catch(() => {
    ElMessage.error('Failed to copy link')
  })
}

// Get icon for share type
function getShareTypeIcon(type: 'user' | 'group' | 'role'): string {
  switch (type) {
    case 'user': return '👤'
    case 'group': return '👥'
    case 'role': return '🎭'
    default: return '👤'
  }
}

// Format share time
function formatShareTime(timestamp?: string): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="`Share: ${view?.name || 'View'}`"
    width="480px"
    :close-on-click-modal="false"
  >
    <div class="share-dialog-content">
      <!-- Search box -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search users, groups, or roles..."
          :prefix-icon="Search"
          clearable
        />
        
        <!-- Search results dropdown -->
        <div v-if="searchResults.length > 0" class="search-results">
          <div
            v-for="result in searchResults"
            :key="`${result.type}-${result.id}`"
            class="search-result-item"
            @click="handleSelectResult(result)"
          >
            <span class="result-icon">{{ getShareTypeIcon(result.type) }}</span>
            <div class="result-info">
              <span class="result-name">{{ result.name }}</span>
              <span v-if="result.email" class="result-email">{{ result.email }}</span>
            </div>
            <el-tag size="small" type="info">{{ result.type }}</el-tag>
          </div>
        </div>
        
        <!-- No results -->
        <div v-else-if="searchQuery && searchResults.length === 0" class="no-results">
          No users, groups, or roles found
        </div>
      </div>
      
      <!-- Permission selector for new shares -->
      <div class="permission-selector">
        <span class="permission-label">Default permission:</span>
        <el-radio-group v-model="selectedPermission" size="small">
          <el-radio-button value="view">Can view</el-radio-button>
          <el-radio-button value="edit">Can edit</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- Shared with list -->
      <div class="shared-list-section">
        <h4 class="section-title">Shared with</h4>
        
        <div v-if="!view?.sharedWith?.length" class="empty-state">
          <p>This view is not shared with anyone yet</p>
        </div>
        
        <div v-else class="shared-list">
          <div
            v-for="share in view.sharedWith"
            :key="`${share.type}-${share.id}`"
            class="shared-item"
          >
            <span class="share-icon">{{ getShareTypeIcon(share.type) }}</span>
            <div class="share-info">
              <span class="share-name">{{ share.name }}</span>
              <span class="share-meta">
                {{ share.type }} • Shared {{ formatShareTime(share.sharedAt) }}
              </span>
            </div>
            <el-select
              :model-value="share.permission"
              size="small"
              class="permission-select"
              @update:model-value="(val) => handlePermissionChange(share, val as SharePermission)"
            >
              <el-option label="Can view" value="view" />
              <el-option label="Can edit" value="edit" />
            </el-select>
            <el-button
              :icon="Delete"
              text
              type="danger"
              size="small"
              @click="handleRemoveShare(share)"
            />
          </div>
        </div>
      </div>
      
      <!-- Copy link -->
      <div class="copy-link-section">
        <el-button
          :icon="Link"
          text
          type="primary"
          @click="handleCopyLink"
        >
          Copy link to view
        </el-button>
      </div>
    </div>
    
    <template #footer>
      <el-button @click="dialogVisible = false">Done</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
}

.search-section {
  position: relative;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--app-paper);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-border-radius-m);
  box-shadow: var(--app-shadow-m);
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs) var(--app-space-s);
  cursor: pointer;
  transition: background 0.15s ease;
  
  &:hover {
    background: var(--app-fill-color);
  }
}

.result-icon {
  font-size: var(--app-font-size-l);
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-name {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
}

.result-email {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
}

.no-results {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-s);
}

.permission-selector {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.permission-label {
  font-size: var(--app-font-size-s);
  color: var(--app-text-color-secondary);
}

.shared-list-section {
  border-top: 1px solid var(--app-border-color);
  padding-top: var(--app-space-m);
}

.section-title {
  margin: 0 0 var(--app-space-s) 0;
  font-size: var(--app-font-size-m);
  font-weight: 600;
  color: var(--app-text-color-primary);
}

.empty-state {
  padding: var(--app-space-m);
  text-align: center;
  color: var(--app-text-color-placeholder);
  
  p {
    margin: 0;
  }
}

.shared-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
}

.shared-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  background: var(--app-fill-color-light);
  border-radius: var(--app-border-radius-s);
}

.share-icon {
  font-size: var(--app-font-size-l);
}

.share-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.share-name {
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-primary);
  font-weight: 500;
}

.share-meta {
  font-size: var(--app-font-size-xs);
  color: var(--app-text-color-placeholder);
}

.permission-select {
  width: 100px;
}

.copy-link-section {
  border-top: 1px solid var(--app-border-color);
  padding-top: var(--app-space-s);
}
</style>

