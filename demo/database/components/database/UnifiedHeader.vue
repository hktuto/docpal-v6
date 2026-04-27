<script lang="ts" setup>
import type { Database, Table, View, Dashboard } from '../../types/database'
import { Setting } from '@element-plus/icons-vue'
import { useDatabase } from '../../composables/useDatabase'

export interface BreadcrumbItem {
  label: string
  icon?: string
  to?: () => void
}

export interface HeaderAction {
  code: string
  label: string
  icon?: string
  divided?: boolean
  disabled?: boolean
  danger?: boolean
  action: () => void
}

const props = defineProps<{
  breadcrumb: BreadcrumbItem[]
  context: {
    type: 'database' | 'table' | 'view' | 'dashboard' | 'record'
    database?: Database
    table?: Table
    view?: View
    dashboard?: Dashboard
    recordId?: string
  }
  actions?: HeaderAction[]
  showCollaborators?: boolean
}>()

const emit = defineEmits<{
  action: [code: string]
}>()

const { getUsers } = useDatabase()

// Get relevant users for this context
const collaborators = computed(() => {
  if (!props.showCollaborators) return []
  
  const userIds = new Set<string>()
  
  // Collect user IDs based on context
  if (props.context.table?.permissionAssignments) {
    props.context.table.permissionAssignments.forEach(p => {
      if (p.subject.type === 'user') {
        userIds.add(p.subject.id)
      }
    })
  }
  
  if (props.context.database?.permissions) {
    props.context.database.permissions.forEach(p => {
      if (p.userId) {
        userIds.add(p.userId)
      }
    })
  }
  
  // Get user details
  const allUsers = getUsers()
  return Array.from(userIds)
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean)
})

// Visible collaborators (max 5)
const visibleCollaborators = computed(() => collaborators.value.slice(0, 5))
const remainingCount = computed(() => Math.max(0, collaborators.value.length - 5))

// Handle breadcrumb click
function handleBreadcrumbClick(item: BreadcrumbItem) {
  if (item.to) {
    item.to()
  }
}

// Handle action click
function handleActionClick(action: HeaderAction) {
  if (!action.disabled) {
    action.action()
    emit('action', action.code)
  }
}
</script>

<template>
  <div class="unified-header">
    <!-- Breadcrumb -->
    <div class="header-breadcrumb">
      <template v-for="(item, index) in breadcrumb" :key="index">
        <span
          class="breadcrumb-item"
          :class="{ 'breadcrumb-item--clickable': item.to }"
          @click="handleBreadcrumbClick(item)"
        >
          <span v-if="item.icon" class="breadcrumb-icon">{{ item.icon }}</span>
          <span class="breadcrumb-label">{{ item.label }}</span>
        </span>
        <span v-if="index < breadcrumb.length - 1" class="breadcrumb-separator">›</span>
      </template>
    </div>

    <!-- Spacer -->
    <div class="header-spacer"></div>

    <!-- Collaborators -->
    <div v-if="showCollaborators && visibleCollaborators.length > 0" class="header-collaborators">
      <el-tooltip
        v-for="user in visibleCollaborators"
        :key="user.id"
        :content="user.name"
        placement="bottom"
      >
        <el-avatar
          :size="28"
          :src="user.avatar"
          class="collaborator-avatar"
        >
          {{ user.name.charAt(0).toUpperCase() }}
        </el-avatar>
      </el-tooltip>
      
      <el-tooltip
        v-if="remainingCount > 0"
        :content="`${remainingCount} more user${remainingCount > 1 ? 's' : ''}`"
        placement="bottom"
      >
        <div class="collaborator-more">
          +{{ remainingCount }}
        </div>
      </el-tooltip>
    </div>

    <!-- Settings Dropdown -->
    <el-dropdown
      v-if="actions && actions.length > 0"
      trigger="click"
      :hide-on-click="true"
      placement="bottom-end"
    >
      <el-button size="small" class="settings-button">
        <el-icon><Setting /></el-icon>
      </el-button>
      
      <template #dropdown>
        <el-dropdown-menu>
          <template v-for="action in actions" :key="action.code">
            <el-dropdown-item
              v-if="action.divided"
              divided
              :disabled="action.disabled"
              :class="{ 'dropdown-item-danger': action.danger }"
              @click="handleActionClick(action)"
            >
              <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
              {{ action.label }}
            </el-dropdown-item>
            <el-dropdown-item
              v-else
              :disabled="action.disabled"
              :class="{ 'dropdown-item-danger': action.danger }"
              @click="handleActionClick(action)"
            >
              <span v-if="action.icon" class="action-icon">{{ action.icon }}</span>
              {{ action.label }}
            </el-dropdown-item>
          </template>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style lang="scss" scoped>
.unified-header {
  display: flex;
  align-items: center;
  gap: var(--app-space-m);
  padding: var(--app-space-s);
  background: var(--app-paper);
  border-bottom: 1px solid var(--app-border-color);
  min-height: 51px;
}

.header-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  flex-shrink: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  font-size: var(--app-font-size-m);
  color: var(--app-text-color-secondary);
  transition: color 0.15s ease;
  
  &--clickable {
    cursor: pointer;
    
    &:hover {
      color: var(--app-primary-color);
    }
  }
  
  &:last-of-type {
    color: var(--app-text-color-primary);
    font-weight: 500;
  }
}

.breadcrumb-icon {
  font-size: var(--app-font-size-l);
}

.breadcrumb-label {
  white-space: nowrap;
}

.breadcrumb-separator {
  color: var(--app-text-color-placeholder);
  font-size: var(--app-font-size-l);
  user-select: none;
}

.header-spacer {
  flex: 1;
  min-width: var(--app-space-m);
}

.header-collaborators {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  flex-shrink: 0;
}

.collaborator-avatar {
  border: 2px solid var(--app-paper);
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    z-index: 1;
  }
  
  &:not(:first-child) {
    margin-left: -8px;
  }
}

.collaborator-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--app-fill-color);
  border: 2px solid var(--app-paper);
  font-size: var(--app-font-size-xs);
  font-weight: 500;
  color: var(--app-text-color-secondary);
  margin-left: -8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--app-primary-color);
    color: white;
    transform: scale(1.1);
    z-index: 1;
  }
}

.settings-button {
  flex-shrink: 0;
}

.action-icon {
  margin-right: var(--app-space-xs);
}

:deep(.dropdown-item-danger) {
  color: var(--app-danger-color);
  
  &:hover {
    background: var(--app-danger-color-light);
    color: var(--app-danger-color);
  }
}
</style>

