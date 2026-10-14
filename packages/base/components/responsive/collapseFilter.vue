<script lang="ts" setup>
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { onClickOutside } from '@vueuse/core'
import { vElementSize } from '@vueuse/components'

const props = withDefaults(
  defineProps<{
    /** Controlled expanded state */
    modelValue?: boolean
    /** Single-row height in px; 0 = auto measure from content */
    rowHeight?: number
  }>(),
  {
    modelValue: undefined,
    rowHeight: 0
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const rootRef = ref<HTMLElement>()
const panelRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

const innerExpanded = ref(false)
const needsToggle = ref(false)
const measuredRowHeight = ref(32)

const isControlled = computed(() => props.modelValue !== undefined)
const expanded = computed({
  get: () => (isControlled.value ? !!props.modelValue : innerExpanded.value),
  set: (value: boolean) => {
    if (isControlled.value) emit('update:modelValue', value)
    else innerExpanded.value = value
  }
})

const collapsedHeight = computed(() =>
  props.rowHeight > 0 ? props.rowHeight : measuredRowHeight.value
)

function measureRowHeight() {
  const el = contentRef.value
  if (!el || props.rowHeight > 0) return
  const first = el.firstElementChild as HTMLElement | null
  measuredRowHeight.value = first?.offsetHeight || el.clientHeight || 32
}

function measureOverflow() {
  const el = contentRef.value
  if (!el) return
  measureRowHeight()
  needsToggle.value = el.scrollHeight > collapsedHeight.value + 2
  if (!needsToggle.value && expanded.value) expanded.value = false
}

function handleToggle() {
  expanded.value = !expanded.value
  nextTick(measureOverflow)
}

function handleCollapse() {
  if (expanded.value) expanded.value = false
}

onClickOutside(panelRef, handleCollapse, {
  ignore: [rootRef, '.el-popper', '.el-select__popper', '.el-picker__popper', '.el-overlay']
})

onMounted(() => {
  nextTick(measureOverflow)
})

defineExpose({
  expand: () => {
    expanded.value = true
  },
  collapse: handleCollapse,
  toggle: handleToggle
})
</script>

<template>
  <div
    ref="rootRef"
    class="responsive-collapse-filter"
    :class="{ 'is-expanded': expanded, 'is-toggleable': needsToggle }"
    :style="{ '--rcf-row-height': `${collapsedHeight}px` }"
  >
    <div
      ref="panelRef"
      class="responsive-collapse-filter__panel"
      v-element-size="measureOverflow"
    >
      <div ref="contentRef" class="responsive-collapse-filter__content">
        <slot />
      </div>
      <button
        v-show="needsToggle"
        type="button"
        class="responsive-collapse-filter__toggle"
        tabindex="0"
        :aria-expanded="expanded"
        :aria-label="$t('button.showAll')"
        @click="handleToggle"
        @keydown.enter.prevent="handleToggle"
      >
        <ElIcon>
          <ArrowUp v-if="expanded" />
          <ArrowDown v-else />
        </ElIcon>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.responsive-collapse-filter {
  position: relative;
  width: 100%;
  height: var(--rcf-row-height);
  min-height: var(--rcf-row-height);
  z-index: 1;

  &.is-expanded {
    z-index: 20;
  }
}

.responsive-collapse-filter__panel {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-xs);
  width: 100%;
  height: var(--rcf-row-height);
  overflow: hidden;
  box-sizing: border-box;
  background: var(--el-bg-color, #fff);
}

.responsive-collapse-filter__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-s);
  flex: 1;
  min-width: 0;
}

.responsive-collapse-filter__toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  cursor: pointer;
  padding: 0;

  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}

.responsive-collapse-filter.is-expanded {
  .responsive-collapse-filter__panel {
    height: auto;
    overflow: visible;
    padding: var(--app-space-s);
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-light);
  }
}
</style>
