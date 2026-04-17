<script setup lang="ts">
import {useTableViewsInject} from '../../../../composables/table/useTableViews'
import { ElMessageBox } from 'element-plus'

const popoverRef = ref()
const activeView = ref<ViewConfig | null>(null)

const { updateView, deleteView, currentView, createView } = useTableViewsInject()

function open(target: HTMLElement, view: ViewConfig) {
  activeView.value = view
  popoverRef.value?.open(target)
}

function close() {
  popoverRef.value?.close()
  activeView.value = null
}

async function handleRename() {
  if (!activeView.value) {
    return
  }
  const { value, action } = await ElMessageBox.prompt('请输入视图名称', '重命名视图', {
    inputValue: activeView.value.name,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).catch(() => ({ value: '', action: 'cancel' }))
  if (action !== 'confirm' || !value || value === activeView.value.name) {
    return
  }
  await updateView(activeView.value.id, { name: value })
  close()
}

async function handleDuplicate() {
  // TODO: 视图复制逻辑在后续补充
  const newView = { ...currentView.value, name: `${activeView.value.name} 副本` }
  await createView(newView)
  close()
}

async function handleDelete() {
  if (!activeView.value) {
    return
  }
  await ElMessageBox.confirm(`确定要删除视图「${activeView.value.name}」吗？`, '删除视图', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => null)
  if (!activeView.value) {
    return
  }
  await deleteView(activeView.value.id)
  close()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiPopoverDialog ref="popoverRef" placement="bottom-start" :width="220" :close-on-click-outside="true">
    <div class="view-actions-menu" v-if="activeView">
      <div class="action-item" @click="handleRename">
        <Icon name="material-symbols:edit-outline" />
        <span>重命名视图</span>
      </div>
      <div class="action-item" @click="handleDuplicate">
        <Icon name="material-symbols:content-copy-outline" />
        <span>复制视图</span>
      </div>
      <!-- <div class="action-item" disabled>
        <Icon name="material-symbols:magic-button-outline" />
        <span>生成视图的神奇表单</span>
      </div> -->
      <!-- <div class="action-item" disabled>
        <Icon name="material-symbols:flip-outline" />
        <span>生成视图的镜像</span>
      </div> -->
      <div class="action-divider" />
      <div class="action-item danger" @click="handleDelete">
        <Icon name="material-symbols:delete-outline" />
        <span>删除视图</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<style scoped lang="scss">
.view-actions-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  padding: var(--app-space-xs);
  border-radius: var(--app-border-radius-s);
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: var(--app-font-size-s);

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.danger {
    color: var(--el-color-danger);

    &:hover {
      background: var(--el-color-danger-light-9);
    }
  }
}

.action-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--app-border-color);
}
</style>
