<script lang="ts" setup>
import type { View } from '../../../types/database'

const props = defineProps<{
  view: View
}>()

function getViewTypeIcon(type: View['type']): string {
  const icons: Record<View['type'], string> = {
    'table': '📋',
    'kanban': '📌',
    'gantt': '📊',
    'calendar': '📅',
    'gallery': '🖼️'
  }
  return icons[type] || '📋'
}

function getViewTypeName(type: View['type']): string {
  const names: Record<View['type'], string> = {
    'table': 'Table',
    'kanban': 'Kanban',
    'gantt': 'Gantt',
    'calendar': 'Calendar',
    'gallery': 'Gallery'
  }
  return names[type] || 'View'
}

function getConfigDescription(): string {
  const config = props.view.config
  if (!config) return ''
  
  switch (props.view.type) {
    case 'gantt':
      return `Timeline from ${config.startDateField || '?'} to ${config.endDateField || '?'}`
    case 'calendar':
      return `Date field: ${config.dateField || '?'}`
    case 'gallery':
      return `Title field: ${config.titleField || 'auto'}`
    default:
      return ''
  }
}
</script>

<template>
  <div class="placeholder-view">
    <div class="placeholder-icon">{{ getViewTypeIcon(view.type) }}</div>
    <h3>{{ getViewTypeName(view.type) }} View</h3>
    <p v-if="getConfigDescription()">{{ getConfigDescription() }}</p>
    <p class="coming-soon">Coming soon...</p>
  </div>
</template>

<style lang="scss" scoped>
.placeholder-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--app-paper);
  border-radius: var(--app-border-radius-m);
  border: 1px solid var(--app-border-color);

  .placeholder-icon {
    font-size: 64px;
    margin-bottom: var(--app-space-s);
  }

  h3 {
    font-size: var(--app-font-size-xl);
    color: var(--app-text-color-primary);
    margin: 0 0 var(--app-space-xs) 0;
  }

  p {
    font-size: var(--app-font-size-m);
    color: var(--app-text-color-secondary);
    margin: 0;
  }

  .coming-soon {
    margin-top: var(--app-space-m);
    padding: var(--app-space-xs) var(--app-space-m);
    background: var(--app-fill-color);
    border-radius: var(--app-border-radius-s);
    color: var(--app-text-color-placeholder);
  }
}
</style>

