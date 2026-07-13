<script setup lang="ts">
import type { ContextMenuOption } from '../../../composables/useRowContextMenuActions'

const popoverRef = ref()
const optionList = ref<ContextMenuOption[]>([])

function open(mouseEvent: MouseEvent, options: ContextMenuOption[]) {
  optionList.value = options.filter((item) => item.visible !== false)
  if (optionList.value.length === 0) {
    return
  }
  popoverRef.value.open(mouseEvent)
}

function close() {
  popoverRef.value?.close()
}

async function handleOptionClick(item: ContextMenuOption) {
  if (item.disabled) {
    return
  }
  await item.onClick()
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiDpPopover ref="popoverRef">
    <div class="context-menu-popover">
      <div
        v-for="item in optionList"
        :key="item.label"
        class="context-menu-popover-item"
        :class="{ 'is-disabled': item.disabled }"
        tabindex="0"
        :aria-label="item.label"
        :aria-disabled="item.disabled ? 'true' : undefined"
        @click="handleOptionClick(item)"
        @keydown.enter="handleOptionClick(item)"
      >
        <Icon :name="item.icon" />
        <span>{{ item.label }}</span>
      </div>
    </div>
  </UiDpPopover>
</template>

<style scoped lang="scss">
.context-menu-popover {
  margin: var(--app-space-xs);
}

.context-menu-popover-item {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);

  &:hover:not(.is-disabled) {
    background: var(--app-primary-alpha-30);
    color: var(--app-primary-color);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
