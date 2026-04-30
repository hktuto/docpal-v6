<script setup lang="ts">
import type { CaseTypeRecord } from '../../../utils/db/schema/newTableSchema'

const props = defineProps<{
  workspace: CaseTypeRecord
  keyword?: string
}>()
const cardRef = ref()
const emits = defineEmits(['selected', 'delete'])

const { highlightText } = useTextHighlight()
const popoverRef = ref()

function handleSelected() {
  emits('selected', props.workspace)
}

function handleView() {
  emits('selected', props.workspace)
  popoverRef.value?.close()
}

function handleDelete() {
  emits('delete', props.workspace)
  popoverRef.value?.close()
}

function openPopover(event: MouseEvent) {
  event.stopPropagation()
  popoverRef.value?.open(event.currentTarget as HTMLElement, cardRef.value as HTMLElement)
}
</script>

<template>
  <div ref="cardRef" :class="{ cardContainer: true, dim: (workspace as any)?.__dim }" @click="handleSelected">
    <div class="cardHeader">
      <div class="iconContainer">
        <Icon v-if="workspace.icon" :name="workspace.icon" />
      </div>
      <div class="cardActions" @click.stop>
        <div class="actionTrigger" @click="openPopover">
          <Icon name="mdi:dots-vertical" />
        </div>
      </div>
    </div>
    <div class="cardTitle" v-tooltip="workspace.name" v-html="highlightText(workspace.name, keyword || '')"></div>
    <div class="cardDescription" v-html="highlightText(workspace.description || '', keyword || '')"></div>
  </div>

  <UiPopoverDialog ref="popoverRef" placement="bottom-start" :width="160" :close-on-click-outside="true">
    <div class="card-menu">
      <div class="menu-item" @click="handleView">
        <Icon name="lucide:eye" />
        <span>View</span>
      </div>
      <div class="menu-item delete-item" @click="handleDelete">
        <Icon name="lucide:trash-2" />
        <span>Delete</span>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.cardContainer {
  width: var(--list-card-width, 100%);
  margin: var(--app-space-xs);
  background-color: var(--app-paper);
  padding: var(--app-space-s);
  border-radius: var(--app-border-radius-m);
  border: 1px solid var(--app-grey-800);
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  cursor: pointer;
  transform: scale(1);
  transition: all 0.2s ease;
  position: relative;

  &.dim {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:hover:not(.dim) {
    border: 1px solid var(--app-primary-color);

    .cardActions {
      opacity: 1;
    }
  }
}

.cardHeader {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--app-space-s);
}

.cardActions {
  opacity: 0;
  transition: opacity 0.2s ease;

  .actionTrigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--app-border-radius-s);
    cursor: pointer;
    color: var(--app-text-color-secondary);
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--app-grey-800);
      color: var(--app-text-color);
    }
  }
}

.cardTitle {
  font-size: var(--app-font-size-l);
  font-weight: 900;
  width: 100%;
  white-space: normal;
  text-overflow: ellipsis;
  overflow: hidden;
  word-break: break-all;
  :deep(mark.highlight) {
    background-color: yellow;
    color: var(--app-primary);
    font-weight: 600;
    border-radius: var(--app-border-radius-xs);
    padding: 0 2px;
  }
}

.cardDescription {
  width: 100%;

  :deep(mark.highlight) {
    background-color: yellow;
    color: var(--app-primary);
    font-weight: 600;
    border-radius: var(--app-border-radius-xs);
    padding: 0 2px;
  }
}

.iconContainer {
  padding: var(--app-space-s);
  background-color: var(--app-grey-500);
  border-radius: var(--app-border-radius-m);
  display: grid;
  place-items: center;
}

.cardIcon {
  line-height: 0;
  font-size: var(--app-font-size-xxl);
}

.card-menu {
  padding: var(--app-space-xs) 0;

  .menu-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    padding: var(--app-space-xs) var(--app-space-s);
    cursor: pointer;
    transition: background-color 0.2s ease;
    color: var(--app-text-color);

    &:hover {
      background-color: var(--app-grey-800);
    }

    &.delete-item {
      color: var(--app-error-color);

      &:hover {
        background-color: var(--app-error-color-light);
      }
    }

    span {
      font-size: var(--app-font-size-s);
    }

    .icon {
      font-size: var(--app-font-size-m);
    }
  }
}
</style>
