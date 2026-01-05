<script setup lang="ts">
import type { WorkspaceType } from '../../../utils/db/schema';

  const props = defineProps<{
    workspace: WorkspaceType
  }>()
  const emits = defineEmits(['selected'])
  function handleSelected() {
    emits('selected', props.workspace)
  }
</script>

<template>
  <div :class="{'cardContainer': true, 'dim': (workspace as any)?.__dim}" @click="handleSelected">
    <div class="iconContainer">
        <Icon v-if="workspace.icon" :name="workspace.icon" />
      </div>
      <div class="cardTitle">
        {{ workspace.name }}
      </div>
      <div class="cardDescription">
        {{ workspace.description }}
      </div>
  </div>
</template>

<style lang="scss" scoped>
  .cardContainer{
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
    &.dim{
      opacity: 0.5;
      cursor: not-allowed;
    }
    &:hover:not(.dim){
      border: 1px solid var(--app-primary-color);
      // transform: scale(1.01);
    }
  }
  .cardTitle{
    font-size: var(--app-font-size-l);
    font-weight: 900;
  }
  .iconContainer{
    padding: var(--app-space-s);
    background-color: var(--app-grey-500);
    border-radius: var(--app-border-radius-m);
    display: grid;
    place-items: center;
    margin-bottom: var(--app-space-s);
  }
  .cardIcon{
    line-height: 0;
    font-size: var(--app-font-size-xxl);
  }
</style>
