<script lang="ts" setup>
const props = defineProps<{
  doc: any,
  selected: boolean,
}>()

const statusColor = computed(() => {
  if(props.doc.status.includes('fail')) {
    return 'var(--app-error-color)'
  }
  if (props.doc.status === 'processed') {
    return 'var(--app-info-color)'
  } else if (props.doc.status === 'cancelled') {
    return 'var(--app-warning-color)'
  } else if(props.doc.status === "verified") {
    return 'var(--app-primary-color)'
  }
  return 'var(--app-info-color)'
})
</script>

<template>
  <div
    :class="{ 'fileItem': true, 'selected': selected }"
    :style="{ '--status-color': statusColor }"
  >
    <div class="trafficLight"></div>
    <span class="fileName">{{ doc.originalFilename }}</span>
  </div>
</template>

<style lang="scss" scoped>
.fileItem {
  width: 100%;
  padding: var(--app-space-xs);
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  border-radius: var(--app-radius-s);
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--app-grey-800);
  }

  &.selected {
    background-color: var(--app-grey-900);
    color: var(--app-primary-color);
  }
}

.trafficLight {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--status-color);
  flex-shrink: 0;
}

.fileName {
  font-size: var(--app-font-size-s);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
