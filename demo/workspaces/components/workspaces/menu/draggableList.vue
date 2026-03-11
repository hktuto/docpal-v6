<script setup lang="ts">
import type { TreeItem } from '../../../composables/workspace/useSingleWorkspace'
import { useSingleWorkspaceContext } from '../../../composables/workspace/useSingleWorkspace'
import type { ElTree } from 'element-plus'
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'

interface Props {
  modelValue: TreeItem[]
  level?: number
  parentId?: string | null
  isAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  parentId: null,
  isAdmin: true
})

const emit = defineEmits<{
  'update:modelValue': [items: TreeItem[]]
}>()

const menuContext = useSingleWorkspaceContext()

const treeRef = ref<InstanceType<typeof ElTree>>()

const treeProps = {
  label: 'name',
  children: 'children'
}

// 深拷贝树节点（不含 children 引用），用于拖拽后生成新树
function cloneTreeNode(node: TreeItem): TreeItem {
  const { children, ...rest } = node
  const cloned: TreeItem = { ...rest } as TreeItem
  if (children && children.length > 0) {
    cloned.children = children.map(cloneTreeNode)
  }
  return cloned
}


// 在树中查找节点所在父级与下标（父为 null 表示根）
function findParentAndIndex(items: TreeItem[], nodeId: string, parent: TreeItem[] | null = null): { parentList: TreeItem[]; index: number } | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].id === nodeId) {
      return { parentList: parent || items, index: i }
    }
    const child = items[i].children
    if (child?.length) {
      const found = findParentAndIndex(child, nodeId, child)
      if (found) return found
    }
  }
  return null
}

// 在树中查找节点的父节点 id（根节点返回 null，未找到返回 undefined）
function findParentId(items: TreeItem[], nodeId: string, parentId: string | null = null): string | null | undefined {
  for (const item of items) {
    if (item.id === nodeId) return parentId
    if (item.children?.length) {
      const found = findParentId(item.children, nodeId, item.id)
      if (found !== undefined) return found
    }
  }
  return undefined
}

// 获取节点在父级中的下一个兄弟节点 id（无则返回 undefined）
function getNextSiblingId(items: TreeItem[], nodeId: string): string | undefined {
  const pos = findParentAndIndex(items, nodeId)
  if (!pos) return undefined
  const { parentList, index } = pos
  const next = parentList[index + 1]
  return next?.id
}

async function handleNodeDrop(draggingNode: { data: TreeItem; key: string }, dropNode: { data: TreeItem; key: string }, dropType: 'inner' | 'prev' | 'next', event: Event) {
  console.log('handleNodeDrop', draggingNode, dropNode, dropType, event)
  return
  const moveId = draggingNode.data.id
  let moveToParentId: string | null
  let insertBeforeMenuId: string | undefined

  moveToParentId = dropNode.data.id

  insertBeforeMenuId = getNextSiblingId(dropNode.parent.data, dropNode.data.id)

  const body: { move_to_parent_id?: string | null; insert_before_menu_id?: string } = {
    move_to_parent_id: moveToParentId ?? null
  }
  if (insertBeforeMenuId !== undefined) {
    body.insert_before_menu_id = insertBeforeMenuId
  }

  try {
    await newClientApi.putDynamicDbMenusIdMove(moveId, body)
    ElMessage.success('菜单已移动')
  } catch (err: any) {
    console.error('move menu failed', err)
    await menuContext.getMenuFromDb()
    ElMessage.error(err?.message ?? '移动菜单失败')
  }
}

function allowDrop(_draggingNode: any, dropNode: any, _type: string) {
  return dropNode?.data?.item_type === 'folder'
}
</script>

<template>
  <el-tree
    ref="treeRef"
    :data="modelValue"
    :props="treeProps"
    node-key="id"
    default-expand-all
    :draggable="isAdmin"
    :allow-drop="allowDrop"
    :allow-drag="isAdmin"
    highlight-current
    :expand-on-click-node="false"
    class="menu-tree"
    :class="{ [`level-${level}`]: true }"
    @node-drop="handleNodeDrop"
  >
    <template #default="{ node, data }">
      <WorkspacesMenuItem :item="data" :is-admin="isAdmin" />
    </template>
  </el-tree>
</template>

<style scoped lang="scss">
.menu-tree {
  background: transparent;

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    padding: 0;
    display: flex;
  }
}
</style>
