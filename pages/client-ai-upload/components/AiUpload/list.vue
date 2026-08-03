<script lang="ts" setup>
import { ElMessageBox } from 'element-plus'
import { newClientApi } from 'api'

const props = defineProps<{
  fileList: any[]
  repearNameIdList?: string[]
}>()

const emit = defineEmits<{
  nodeClick: [data: any]
}>()

const { t } = useI18n()
const treeRef = ref()

function handleNodeClick(data: any) {
  emit('nodeClick', data)
}

async function handleDeleteFile(data: any) {
  try {
    const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToDelete')}`, {
      confirmButtonText: t('dpButtom_confirm'),
      cancelButtonText: t('dpButtom_cancel')
    }).catch((action) => {
      return action
    })
    if (action !== 'confirm') return
    await newClientApi.deleteDmsUploadTmpFileId(data.id).then((r) => r.data)
    treeRef.value.remove(data)
  } catch (error) {
    console.log(error)
  }
}

defineExpose({
  setCurrentKey: (key: string) => treeRef.value?.setCurrentKey(key),
  getNodesMap: () => treeRef.value?.store.nodesMap
})
</script>

<template>
  <el-tree
    ref="treeRef"
    :data="props.fileList"
    default-expand-all
    nodeKey="id"
    :expand-on-click-node="false"
    @node-click="handleNodeClick"
  >
    <template #default="{ data }">
      <div :class="['flex-x-between', 'tree-item', { 'disabled-line': data.isUpload === false }]">
        <span :class="['flex-x-start', { color__danger: props.repearNameIdList?.includes(data.id) }]">
          <BrowseItemIcon :type="data.isFolder ? 'folder' : 'file'" :fileName="data.name" />
          {{ data.name }}
        </span>
        <div class="flex-x-start" style="--icon-size: 1.14rem">
          <SvgIcon src="/icons/menu/trash.svg" class="el-icon--right" @click.stop="handleDeleteFile(data)" />
        </div>
      </div>
    </template>
  </el-tree>
</template>

<style scoped lang="scss">
:deep(.el-tree-node) {
  height: 2.4rem;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--el-tree-node-hover-bg-color);
}

.tree-item {
  width: 100%;
  padding-right: var(--app-space-xs);
  display: flex;
  gap: var(--app-space-xs);
  overflow: hidden;
  position: relative;

  .fileName {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.disabled-line {
  text-decoration: line-through;
  color: var(--app-grey-950);
}
</style>
