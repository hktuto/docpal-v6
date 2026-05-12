<script setup lang="ts">
import type { AwarenessState } from '../../../composables/useHocuspocusManager'

const props = defineProps<{
  state: AwarenessState
  type: string
}>()

const user = computed(() => props.state.user)
const focus = computed(() => props.state.focus)
</script>

<template>
  <div
    v-if="user"
    class="user-cursor-tag"
    :class="`type-${type}`"
    :style="{ backgroundColor: user.color }"
  >
    <el-tooltip :content="user.name" placement="top">
      <div class="cursor-dot">
        {{ user.name.charAt(0).toUpperCase() }}
      </div>
    </el-tooltip>
  </div>
</template>

<style scoped lang="scss">
.user-cursor-tag {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
  cursor: pointer;
}

.cursor-dot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
