<template>
  <el-button v-if="show" ref="buttonRef" :disabled="disabled" text type="info" @click="handleMirror">
    <Icon name="material-symbols:text-compare-rounded" class="empty-icon el-icon--left" />
    {{ mirrorList.length > 0 ? `${mirrorList.length} mirrors` : 'Mirror' }}
  </el-button>
  <UiPopoverDialog ref="popoverRef" :width="260">
    <div class="mirror-list">
      <div v-for="item in mirrorList" :key="item.id" class="mirror-item" @click="handleSelectMirror(item)">
        <Icon name="material-symbols:text-compare-rounded" class="empty-icon el-icon--left" />
        {{ item.label || item.name || item.metadata?.name || item.id }}
      </div>
      <el-button text type="info" @click="handleAddMirror"> Add Mirror </el-button>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { emitBus, EventType } from 'eventbus'
interface Props {
  disabled?: boolean
  show?: boolean
}
const props = defineProps<Props>()
const viewTools = inject('viewTools')
const buttonRef = ref()
const popoverRef = ref()
const mirrorList = computed<any[]>(() => viewTools?.mirrorList?.value || [])

const handleMirror = () => {
  if (mirrorList.value.length > 0) {
    popoverRef.value?.open(buttonRef.value?.$el || buttonRef.value)
    return
  } else {
    handleAddMirror()
  }
}
function handleAddMirror() {
  emitBus(EventType.ADD_MIRROR)
}
const handleSelectMirror = (item: any) => {
  popoverRef.value?.close?.()
  viewTools?.navigateToTableMenu?.(item?.id)
}
</script>

<style scoped lang="scss">
.mirror-list {
  min-width: 220px;
  max-height: 260px;
  overflow: auto;
}

.mirror-item {
  padding: var(--app-space-xs);
  cursor: pointer;
  border-radius: var(--app-radius-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
  &:hover {
    background: var(--app-primary-alpha-30);
    color: var(--app-primary);
  }
}
</style>
