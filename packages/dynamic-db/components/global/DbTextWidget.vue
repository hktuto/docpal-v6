<template>
  <DashboardCard
    ref="cardRef"
    :title="'Note'"
    :hide-setting="hideSetting"
    :setting="setting"
    :setting-ref="settingRef"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <div class="db-text-widget" :style="widgetStyle">
      <div class="text-content" :style="contentStyle" v-html="renderedContent" />
    </div>
  </DashboardCard>
  <DbTextWidgetSetting ref="settingRef" @refresh="handleRefresh" @delete="handleDelete" />
</template>

<script setup lang="ts">
import { marked } from 'marked'

const props = withDefaults(
  defineProps<{
    setting?: any
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete', 'refreshSetting'])

const settingRef = ref()
const cardRef = ref()

const widgetStyle = computed(() => ({
  backgroundColor: props.setting?.bgColor || '#ffffff'
}))

const contentStyle = computed(() => {
  const sizeMap: Record<string, string> = {
    small: 'var(--app-font-size-s)',
    medium: 'var(--app-font-size-m)',
    large: 'var(--app-font-size-l)'
  }
  return {
    color: props.setting?.textColor || '#333333',
    fontSize: sizeMap[props.setting?.fontSize] || sizeMap.medium
  }
})

const renderedContent = computed(() => {
  const content = props.setting?.content || ''
  if (!content) return '<em class="empty-hint">No content</em>'
  try {
    return marked.parse(content, { async: false }) as string
  } catch {
    return content
  }
})

function handleDelete() {
  emit('delete')
}

function handleRefresh(newSetting: any) {
  emit('refreshSetting', newSetting)
}

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-text-widget {
  height: 100%;
  overflow: auto;
  padding: var(--app-space-s);
}
.text-content {
  line-height: 1.6;
}
:deep(.empty-hint) {
  color: var(--app-text-color-placeholder);
  font-style: italic;
}
:deep(h1, h2, h3, h4, h5, h6) {
  margin: var(--app-space-xs) 0;
}
:deep(p) {
  margin: var(--app-space-xs) 0;
}
:deep(ul, ol) {
  margin: var(--app-space-xs) 0;
  padding-left: var(--app-space-m);
}
:deep(a) {
  color: var(--app-primary-color);
}
:deep(code) {
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
