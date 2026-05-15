<script setup lang="ts">
import type { AwarenessState } from '../../../composables/useHocuspocusManager'

const props = defineProps<{
  states: AwarenessState[]
  type: string
  width: number
  height: number
}>()

const firstUser = computed(() => props.states[0]?.user)
const borderColor = computed(() => firstUser.value?.color || '#999')

const anyOneEditing = computed(() => props.states.some((s) => s.focus?.editingCell || s.focus?.editingRow))
</script>

<template>
  <div
    class="user-cursor-tag"
    :class="`type-${type}`"
    :style="{ width: width + 'px', height: height + 'px' }"
  >
    <!-- Cell-following border -->
    <div
      class="cell-border"
      :class="{anyOneEditing}"
      :style="{ '--color': borderColor }"
    />

    <!-- Stacked user dots -->
    <div class="cursor-dot-contaioner">


        <div
        v-for="(state, idx) in states"
        :key="state.user!.id"
        class="cursor-dot"
        :style="{

            backgroundColor: state.user!.color,
            top: (idx * 22) + 'px'
        }"
        >
        <el-tooltip :content="state.user!.name" placement="top">
            <div class="dot-inner">
            {{ state.user!.name.charAt(0).toUpperCase() }}
            {{ state.focus?.editingCell ? ': Edit Cell' : state.focus?.editingRow? ': Edit Row' :'' }}
            </div>
        </el-tooltip>
        </div>
        </div>
  </div>
</template>

<style scoped lang="scss">
.user-cursor-tag {
  position: relative;
  pointer-events: none;
}

.cell-border {
  position: absolute;
  width: calc(100% + 4px);
  height: calc(100% + 4px);
  top: -2px;
  left: -2px;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--color) 0%, transparent 20%);
              border-image-slice: 1;
  &.anyOneEditing{
      border: 2px solid var(--color);
  }
}

.cursor-dot-contaioner{
    position: absolute;
    left: calc(var(--app-space-s) * -1);
    top: calc(var(--app-space-s) * -1);
}
.cursor-dot {
  position: absolute;
  left: 0;
  height: 20px;
  border-radius: var(--app-border-radius-m);
  padding: var(--app-space-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
  z-index: 2;
  min-width: 20px;

}

.dot-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;


}
</style>
