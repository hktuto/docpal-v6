<script setup lang="ts">
import { ArrowRight, Loading } from '@element-plus/icons-vue'

interface Props {
  title?: string
  value?: any
  count?: number | string
  expanded?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  count: undefined,
  expanded: false,
  loading: false
})

const { t } = useI18n()

const emit = defineEmits<{
  toggle: []
}>()

const displayTitle = computed(() => props.title ?? t('mdTable.cardGroup.defaultTitle'))

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return t('mdTable.cardGroup.emptyValue')
  }
  return String(props.value)
})

const countText = computed(() => {
  if (props.count === null || props.count === undefined || props.count === '') {
    return ''
  }
  return t('mdTable.cardGroup.recordCount', { count: props.count })
})

const groupHeaderAriaLabel = computed(() => {
  const parts = [displayTitle.value, displayValue.value]
  if (countText.value) {
    parts.push(countText.value)
  }
  return parts.join(', ')
})

function handleToggle() {
  emit('toggle')
}
</script>

<template>
  <button
    type="button"
    class="md-card-group-header"
    :aria-expanded="expanded"
    :aria-label="groupHeaderAriaLabel"
    tabindex="0"
    @click="handleToggle"
    @keydown.enter="handleToggle"
  >
    <el-icon class="group-toggle-icon" :class="{ 'is-loading': loading, 'is-expanded': !loading && expanded }">
      <Loading v-if="loading" />
      <ArrowRight v-else />
    </el-icon>
    <span class="group-title">{{ displayTitle }}</span>
    <span class="group-value">{{ displayValue }}</span>
    <span v-if="countText" class="group-count">{{ countText }}</span>
  </button>
</template>

<style scoped lang="scss">
.md-card-group-header {
  width: 100%;
  padding: 8px 4px;
  border: 0;
  background: transparent;
  color: var(--app-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  font-size: var(--app-font-size-m);
  font-weight: 700;
  outline: none;

  &:focus-visible {
    border-radius: 4px;
    box-shadow: 0 0 0 2px var(--app-primary-light-5);
  }
}

.group-toggle-icon {
  color: var(--app-text-color-secondary);
  font-size: 12px;
  &.is-loading {
    animation: group-loading-rotate 1s linear infinite;
  }

  &.is-expanded :deep(svg) {
    transform: rotate(90deg);
    transition: transform 0.5s ease-in-out;
  }
}

.group-title {
  color: var(--app-text-color-primary);
}

.group-value {
  color: var(--app-text-color-primary);
}

.group-count {
  color: var(--app-text-color-secondary);
  font-size: var(--app-font-size-s);
  font-weight: 400;
}

@keyframes group-loading-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
