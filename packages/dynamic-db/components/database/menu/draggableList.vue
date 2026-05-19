<script setup lang="ts">
import type { TreeItem } from '../../../composables/workspace/useSingleDatabase'
import { useSingleWorkspaceContext } from '../../../composables/workspace/useSingleDatabase'
import type { ElTree } from 'element-plus'
import { newClientApi } from 'api'
import { ElMessage } from 'element-plus'
import { useMagicKeys } from '@vueuse/core'

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

const menuContext = useSingleDatabaseContext()
const { databaseMenuRouteParams } = menuContext
const treeRef = ref<InstanceType<typeof ElTree>>()

const treeProps = {
  label: 'name',
  children: 'children'
}

async function handleNodeDrop(
  draggingNode: { data: TreeItem; key: string },
  dropNode: { data: TreeItem; key: string },
  dropType: 'inner' | 'before' | 'after',
  event: Event
) {
  console.log('handleNodeDrop:', dropType, { draggingNode }, { dropNode }, event)
  const moveId = draggingNode.data.id
  const body: { move_to_parent_id?: string | null; insert_before_menu_id?: string } = {}
  if (dropType === 'inner') {
    body.move_to_parent_id = dropNode.data.id
  } else if (dropType === 'before') {
    body.move_to_parent_id = dropNode.data.parent_id
    body.insert_before_menu_id = dropNode.data.id
  } else if (dropType === 'after') {
    body.move_to_parent_id = dropNode.data.parent_id
    const siblings = dropNode.parent?.childNodes ?? []
    const dropIndex = siblings.findIndex((node: any) => node.data.id === dropNode.data.id)
    const nextSibling = siblings[dropIndex + 2]
    if (nextSibling && nextSibling.data.id !== moveId) {
      body.insert_before_menu_id = nextSibling.data.id
      body.insert_before_menu_name = nextSibling.data.name
    }
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
  return dropNode?.data?.item_type === 'folder' || (_type !== 'inner' && dropNode.data.item_type !== 'folder')
}
function handleNodeClick(nodeData: any) {
  setTimeout(() => {
    const menuState = menuContext.menuState.value
    if (menuState.editingItemId === nodeData.id) return
    menuContext.navigateToItem(nodeData)
  }, 100)
}

const { f2 } = useMagicKeys()
watchEffect(() => {
  if (f2?.value) {
    const currentNode = treeRef.value?.getCurrentNode()
    if (!currentNode) return
    menuContext.startEdit(currentNode?.id as string)
  }
})
async function syncCurrentTreeKey() {
  const detailId = databaseMenuRouteParams.value.detailId
  await nextTick()
  treeRef.value?.setCurrentKey(detailId || null)
  await nextTick()
  scrollCurrentNodeIntoView()
}

function scrollCurrentNodeIntoView() {
  const treeElement = treeRef.value?.$el as HTMLElement | undefined
  if (!treeElement) return

  const currentNodeElement = treeElement.querySelector('.el-tree-node.is-current > .el-tree-node__content') as HTMLElement | null
  currentNodeElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

watch(
  () => databaseMenuRouteParams.value.detailId,
  () => {
    syncCurrentTreeKey()
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  () => {
    syncCurrentTreeKey()
  },
  { deep: true, flush: 'post' }
)
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
    @node-click="handleNodeClick"
  >
    <template #default="{ node, data }">
      <DatabaseMenuItem :item="data" :is-admin="isAdmin" />
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
