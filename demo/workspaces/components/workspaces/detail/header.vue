<script lang="ts" setup>
import type { WorkspaceRouteParams, TreeItem } from '../../../composables/useSingleWorkspace'
import { ArrowDown, Folder, Grid, Postcard, DataAnalysis } from '@element-plus/icons-vue'

const { workspaceRouteParams, workspace, menuState, navigateToItem, findItemById } = useSingleWorkspaceContext()

defineSlots<{
  default?: (props: {}) => any
  left?: (props: {}) => any
  right?: (props: {}) => any
}>()

type BreadcrumbItem = {
  label: string
  params: WorkspaceRouteParams
  isFolder: boolean
  children?: TreeItem[] // Children items for dropdown (only for folders)
  itemId?: string | null // Original item ID for finding children
}

const breadcrumbList = ref<BreadcrumbItem[]>([])

/**
 * Recursively find the path from root to the target item
 * Returns true if target is found, path will be built in result array
 */
function findPathToItem(items: TreeItem[], targetId: string, path: BreadcrumbItem[]): boolean {
  for (const item of items) {
    // Add current item to path
    const breadcrumbItem: BreadcrumbItem = {
      label: item.label,
      params: {
        detailId: item.id,
        detailType: item.itemType
      },
      isFolder: item.itemType === 'folder',
      itemId: item.id,
      children: item.itemType === 'folder' ? item.children : undefined
    }
    path.push(breadcrumbItem)

    // Check if this is the target
    if (item.id === targetId) {
      return true
    }

    // Search in children if exists
    if (item.children && item.children.length > 0) {
      if (findPathToItem(item.children, targetId, path)) {
        return true
      }
    }

    // Not found in this branch, remove from path
    path.pop()
  }
  return false
}

function createBreadcrumb() {
  // Always start with root (workspace)
  const rootItem: BreadcrumbItem = {
    label: workspace.value?.name || '',
    params: {
      detailId: null,
      detailType: 'root'
    },
    isFolder: true, // Workspace root acts like a folder
    itemId: null,
    children: menuState.value.items // Root children are the top-level items
  }

  if (workspaceRouteParams.value.detailType === 'root' || !workspaceRouteParams.value.detailId) {
    breadcrumbList.value = [rootItem]
    return
  }

  // Build path to current item
  const path: BreadcrumbItem[] = []
  findPathToItem(menuState.value.items, workspaceRouteParams.value.detailId, path)

  breadcrumbList.value = [rootItem, ...path]
}

function handleBreadcrumbClick(item: BreadcrumbItem) {
  if (item.params.detailType === 'root') {
    navigateToItem(undefined)
  } else if (item.params.detailId) {
    const menuItem = findItemById(menuState.value.items, item.params.detailId)
    if (menuItem) {
      navigateToItem(menuItem)
    }
  }
}

function handleDropdownItemClick(item: TreeItem) {
  navigateToItem(item)
}

watch(
  menuState,
  () => {
    createBreadcrumb()
  },
  {
    deep: true
  }
)
watch(
  workspaceRouteParams,
  () => {
    createBreadcrumb()
  },
  { immediate: true, deep: true }
)
</script>

<template>
  <div class="headerContainer">
    <div class="headerLeft">
      <div class="header-left-slot">
        <slot name="left" />
      </div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="item.params.detailId ?? 'root'">
          <!-- Dropdown for folder items (except last item) -->
          <el-dropdown
            v-if="item.isFolder && index < breadcrumbList.length - 1"
            trigger="hover"
            placement="bottom-start"
            @command="handleDropdownItemClick"
            :hide-timeout="100"
            :show-timeout="100"
          >
            <span class="breadcrumb-link breadcrumb-dropdown">
              {{ item.label }}
              <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu v-if="item.children && item.children.length > 0" class="breadcrumb-dropdown-menu">
                <!-- Child items -->
                <el-dropdown-item
                  v-for="child in item.children"
                  :key="child.id"
                  :command="child"
                  :class="{ 'is-current': child.id === workspaceRouteParams.detailId }"
                >
                  <div class="dropdown-item-content">
                    <el-icon v-if="child.itemType === 'folder'" class="folder-icon">
                      <Folder />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'table'" class="table-icon">
                      <Grid />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'view'" class="view-icon">
                      <Postcard />
                    </el-icon>
                    <el-icon v-else-if="child.itemType === 'dashboard'" class="dashboard-icon">
                      <DataAnalysis />
                    </el-icon>
                    <span class="dropdown-label">{{ child.label }}</span>
                    <span v-if="child.children && child.children.length > 0" class="dropdown-child-count"> ({{ child.children.length }}) </span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
              <el-dropdown-menu v-else class="breadcrumb-dropdown-menu">
                <el-dropdown-item disabled>
                  <div class="dropdown-item-content">
                    <el-icon class="folder-icon">
                      <Folder />
                    </el-icon>
                    <span class="dropdown-label">Empty folder</span>
                  </div>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <!-- Regular clickable link for non-folder items or last item -->
          <span
            v-else-if="index < breadcrumbList.length - 1"
            class="breadcrumb-link"
            tabindex="0"
            @click="handleBreadcrumbClick(item)"
            @keydown.enter="handleBreadcrumbClick(item)"
          >
            {{ item.label }}
          </span>

          <!-- Current (last) item - not clickable -->
          <span v-else class="breadcrumb-current">
            {{ item.label }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="headerRight">
      <slot name="right" />
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.headerContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--app-space-s) var(--app-space-m);
  height: var(--app-header-height);
  border-bottom: 1px solid var(--app-grey-900);
  background: var(--app-grey-950);
}

.headerLeft {
  display: flex;
  align-items: center;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: color 0.2s;
  display: inline-flex;
  align-items: center;

  &:hover,
  &:focus {
    color: var(--el-color-primary);
  }
}

.breadcrumb-dropdown {
  padding-right: 4px;

  &:hover {
    .dropdown-icon {
      color: var(--el-color-primary);
    }
  }
}

.dropdown-icon {
  margin-left: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  transition: color 0.2s;
}

.breadcrumb-current {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
}

.header-left-slot {
  display: flex;
  align-items: center;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  max-width: 300px;
}

.folder-icon {
  color: var(--el-color-warning);
}

.table-icon {
  color: var(--el-color-primary);
}

.view-icon {
  color: var(--el-color-success);
}

.dashboard-icon {
  color: var(--el-color-info);
}

.dropdown-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-child-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
  opacity: 0.8;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 12px;

  &.is-current {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;

    &:hover {
      background-color: var(--el-color-primary-light-8);
    }
  }
}

.breadcrumb-dropdown-menu {
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--el-fill-color-lighter);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--el-border-color);
    border-radius: 3px;

    &:hover {
      background: var(--el-border-color-darker);
    }
  }
}
</style>
