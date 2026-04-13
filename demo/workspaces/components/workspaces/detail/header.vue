<script lang="ts" setup>
import { InfoFilled } from '@element-plus/icons-vue'
import type { WorkspaceRouteParams, TreeItem } from '../../../composables/workspace/useSingleWorkspace'
import type { CaseTableRecord } from '../../../utils/db/schema/newTableSchema'
import type { MenuDTO } from 'api'
import { ArrowDown, Folder, Grid, Postcard, DataAnalysis, Document } from '@element-plus/icons-vue'

const { workspaceRouteParams, workspace, menuState, navigateToItem, findItemById, goBackFromRecord } = useSingleWorkspaceContext()
const { query } = usePglite()

defineSlots<{
  default?: (props: {}) => any
  left?: (props: {}) => any
  right?: (props: {}) => any
}>()

type BreadcrumbItem = {
  label: string
  name?: string // 展示用，与 label 一致，供模板 item.name 使用
  params: WorkspaceRouteParams
  isFolder: boolean
  isRecord?: boolean // Flag for record items
  children?: TreeItem[] // Children items for dropdown (only for folders)
  itemId?: string | null // Original item ID for finding children
}

type InfoDialogItem = {
  id: string
  descriptioin: string
}

// Record title for breadcrumb when viewing a record
const recordTitle = ref<string>('')

const breadcrumbList = ref<BreadcrumbItem[]>([])
const infoDialogVisible = ref(false)
const infoDialogItem = ref<InfoDialogItem>({
  id: '',
  descriptioin: ''
})

async function createBreadcrumb() {
  const rootItem: BreadcrumbItem = {
    name: workspace.value?.name,
    params: {
      detailId: null,
      detailType: 'root',
      pageType: 'detail'
    },
    isFolder: false
  }

  const params = workspaceRouteParams.value
  let itemId: string | null = params.detailId ?? null
  // record 视图下没有 detailId，用 tableId 在树中查找对应菜单节点
  if (params.detailType === 'record' && params.tableId) {
    const menuNode = findMenuNodeByIdOrItemId(menuState.value.items, params.tableId)
    itemId = menuNode?.id ?? null
  }
  const path = getFullPathFromMenuItems(menuState.value.items, itemId)

  if (params.detailType === 'record' && path.length > 0) {
    // 在路径末尾追加“当前记录”节点，展示 recordTitle
    const last = path[path.length - 1]
    breadcrumbList.value = [
      rootItem,
      ...path.slice(0, -1),
      {
        ...last,
        label: recordTitle.value || last.label,
        name: recordTitle.value || last.label,
        isRecord: true
      }
    ]
  } else {
    breadcrumbList.value = [rootItem, ...path]
  }
}
/**
 * 在树形菜单中根据节点 id 或 item_id 查找节点
 */
function findMenuNodeByIdOrItemId(nodes: MenuDTO[], idOrItemId: string): MenuDTO | undefined {
  for (const node of nodes) {
    if (node.id === idOrItemId || node.item_id === idOrItemId) return node
    const found = node.children?.length ? findMenuNodeByIdOrItemId(node.children, idOrItemId) : undefined
    if (found) return found
  }
  return undefined
}

/**
 * 在树形菜单中查找从根到目标 itemId 的路径，并转换为面包屑项
 * @param items - 菜单树（根级 MenuDTO 数组）
 * @param itemId - 目标节点 ID（菜单节点 id），为 null 时返回空路径（仅 root）
 * @returns 从根到目标节点（含）的 BreadcrumbItem 数组
 */
function getFullPathFromMenuItems(items: MenuDTO[], itemId: string | null): BreadcrumbItem[] {
  if (!itemId) return []

  const path: MenuDTO[] = []

  function findPath(nodes: MenuDTO[], targetId: string): boolean {
    for (const node of nodes) {
      path.push(node)
      if (node.id === targetId) return true
      if (node.children?.length && findPath(node.children, targetId)) return true
      path.pop()
    }
    return false
  }

  if (!findPath(items, itemId)) return []

  return path.map((node) => menuNodeToBreadcrumbItem(node))
}

/** 将 MenuDTO 转为 BreadcrumbItem，用于面包屑与下拉 */
function menuNodeToBreadcrumbItem(node: MenuDTO): BreadcrumbItem {
  const label = node.name ?? node.id ?? ''
  return {
    label,
    name: label,
    params: {
      detailId: node.id ?? null,
      detailType: node.item_type,
      pageType: 'detail',
      description: node.description ?? ''
    },
    isFolder: node.item_type === 'folder',
    isRecord: false,
    children: node.children as TreeItem[] | undefined,
    itemId: node.item_id ?? null
  }
}

function handleBreadcrumbClick(item: BreadcrumbItem) {
  // Clear record title when navigating away
  recordTitle.value = ''

  if (item.params.detailType === 'root') {
    // If currently viewing a record, use goBackFromRecord
    if (workspaceRouteParams.value.detailType === 'record') {
      goBackFromRecord()
      // Then navigate to root
      navigateToItem(undefined)
    } else {
      navigateToItem(undefined)
    }
  } else if (item.params.detailId) {
    // If currently viewing a record and clicking on a breadcrumb item
    if (workspaceRouteParams.value.detailType === 'record') {
      goBackFromRecord()
    }

    const menuItem = findItemById(menuState.value.items, item.params.detailId)
    if (menuItem) {
      navigateToItem(menuItem)
    }
  }
}

function handleDropdownItemClick(item: TreeItem) {
  // Clear record title when navigating away
  if (workspaceRouteParams.value.detailType === 'record') {
    recordTitle.value = ''
    goBackFromRecord()
  }
  navigateToItem(item)
}
function handleInfoClick(item: BreadcrumbItem) {
  infoDialogItem.value = {
    id: item.params.detailId ?? '',
    descriptioin: item.params.description ?? ''
  }
  infoDialogVisible.value = true
}

function handleInfoInput(description: string) {
  const currentItem = breadcrumbList.value[breadcrumbList.value.length - 1]
  if (!currentItem) return
  if (currentItem.params.detailId !== infoDialogItem.value.id) return
  currentItem.params.description = description
  const menuItem = findItemById(menuState.value.items, currentItem.params.detailId)
  if (menuItem) {
    menuItem.description = description
  }
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
  (newParams, oldParams) => {
    // Reset record title when navigating away from record view
    if (oldParams?.detailType === 'record' && newParams?.detailType !== 'record') {
      recordTitle.value = ''
    }
    // Reset record title when record ID changes
    if (newParams?.detailType === 'record' && oldParams?.recordId !== newParams?.recordId) {
      recordTitle.value = ''
    }
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
                    <el-icon v-if="child.item_type === 'folder'" class="folder-icon">
                      <Folder />
                    </el-icon>
                    <el-icon v-else-if="child.item_type === 'table'" class="table-icon">
                      <Grid />
                    </el-icon>
                    <el-icon v-else-if="child.item_type === 'view'" class="view-icon">
                      <Postcard />
                    </el-icon>
                    <el-icon v-else-if="child.item_type === 'dashboard'" class="dashboard-icon">
                      <DataAnalysis />
                    </el-icon>
                    <span class="dropdown-label">{{ child.name }}</span>
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
            {{ item.name }}
          </span>

          <!-- Current (last) item - not clickable -->
          <span v-else class="breadcrumb-current" :class="{ 'is-record': item.isRecord }">
            <el-icon v-if="item.isRecord" class="record-icon"><Document /></el-icon>
            {{ item.name }}
          </span>
          <el-tooltip :content="item.params.description" placement="bottom">
            <el-icon
              v-if="index === breadcrumbList.length - 1 && item.params.detailType === 'master_table'"
              raw-content
              :content="item.params.description"
              class="el-icon--right cursor-pointer"
              @click="handleInfoClick(item)"
            >
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="headerRight">
      <slot name="right" />
      <slot />
    </div>
  </div>
  <WorkspacesDetailInfoPopover v-model="infoDialogVisible" :item="infoDialogItem" @input="handleInfoInput" />
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
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.is-record {
    .record-icon {
      color: var(--el-color-info);
    }
  }
}

.record-icon {
  font-size: 14px;
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
