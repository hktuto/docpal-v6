<template>
  <el-button v-if="show" ref="buttonRef" :disabled="disabled" text type="info" @click="handleClick">
    <Icon name="lucide:history" class="empty-icon el-icon--left" />
    Audit Log
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
  emitBus(EventType.OPEN_SIDE_PANEL, { type: 'auditLog' })
}
</script>

<style scoped lang="scss">
.audit-log-btn {
  display: flex;
  align-items: center;
  gap: var(--app-space-xs);
}
</style>
