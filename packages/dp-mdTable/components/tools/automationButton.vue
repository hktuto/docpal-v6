<template>
  <el-button v-if="show" ref="buttonRef" :disabled="disabled" text type="info" @click="handleClick">
    <Icon name="lucide:zap" class="empty-icon el-icon--left" />
    Automation
  </el-button>
</template>

<script setup lang="ts">
import { emitBus, EventType } from 'eventbus'

interface Props {
  disabled?: boolean
  show?: boolean
}
const props = defineProps<Props>()

const buttonRef = ref()

function handleClick() {
  emitBus(EventType.OPEN_SIDE_PANEL, { type: 'automation' })
}
</script>

<style scoped lang="scss">
.automation-btn {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
