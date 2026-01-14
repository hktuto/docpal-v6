<script lang="ts" setup>
import type { WorkspaceRouteParams, TreeItem } from '../../../composables/useSingleWorkspace'

const { workspaceRouteParams, workspace, menuState, navigateToItem, findItemById } = useSingleWorkspaceContext()

type BreadcrumbItem = {
  label: string
  params: WorkspaceRouteParams 
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
        detailType: item.itemType,
      }
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
      detailType: 'root',
    }
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

watch(workspaceRouteParams, () => {
  createBreadcrumb()
}, { immediate: true, deep: true })
</script>

<template>
  <div class="headerContainer">
    <div class="headerLeft">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="(item, index) in breadcrumbList"
          :key="item.params.detailId ?? 'root'"
        >
          <span
            v-if="index < breadcrumbList.length - 1"
            class="breadcrumb-link"
            tabindex="0"
            @click="handleBreadcrumbClick(item)"
            @keydown.enter="handleBreadcrumbClick(item)"
          >
            {{ item.label }}
          </span>
          <span v-else class="breadcrumb-current">
            {{ item.label }}
          </span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="headerRight">

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

  &:hover,
  &:focus {
    color: var(--el-color-primary);
  }
}

.breadcrumb-current {
  color: var(--el-text-color-primary);
  font-weight: 500;
}
</style>
