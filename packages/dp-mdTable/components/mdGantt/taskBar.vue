<script setup lang="ts">
interface Props {
  task: {
    id: string
    label: string
    start: Date | null
    end: Date | null
    percent: number
    raw: any
  }
  taskStyle: Record<string, string>
  showProgress?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <div class="gantt-row" @click="handleClick">
    <div class="task-label" :title="task.label">
      {{ task.label }}
    </div>
    <div class="task-timeline">
      <div class="task-bar" :style="taskStyle">
        <div
          v-if="showProgress"
          class="task-progress"
          :style="{ width: `${task.percent}%` }"
        />
        <span class="task-bar-label">{{ task.label }}</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.gantt-row {
  display: flex;
  border-bottom: 1px solid var(--app-grey-800);
  cursor: pointer;

  &:hover {
    background: var(--app-color-bg-hover, rgba(0, 0, 0, 0.05));
  }
}

.task-label {
  width: 200px;
  flex-shrink: 0;
  padding: var(--app-space-s) var(--app-space-m);
  border-right: 1px solid var(--app-grey-800);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--app-font-size-s);
}

.task-timeline {
  flex: 1;
  position: relative;
  height: 40px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 10%,
    var(--app-grey-800) 10%,
    var(--app-grey-800) 10.5%
  );
}

.task-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  background: var(--app-primary);
  border-radius: var(--app-border-radius-s);
  overflow: hidden;
  display: flex;
  align-items: center;
  padding: 0 var(--app-space-s);
  min-width: 20px;
}

.task-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: var(--app-success, #67c23a);
  opacity: 0.4;
}

.task-bar-label {
  position: relative;
  z-index: 1;
  font-size: var(--app-font-size-xs);
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
