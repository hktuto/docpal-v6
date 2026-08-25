<template>
  <div class="invoice-list">
    <div
      v-for="item in items"
      :key="item.id"
      class="invoice-card"
      :class="{ 'is-selected': selectedId === item.id }"
      role="button"
      tabindex="0"
      :aria-label="getName(item)"
      :title="getName(item)"
      @click="emit('select', item)"
      @keydown="handleKeydown($event, item)"
    >
      <div class="invoice-card-body">
        <div class="invoice-card-name">{{ getName(item) || '--' }}</div>
        <div class="invoice-card-meta">
          <slot name="meta" :item="item" />
        </div>
      </div>
      <span v-if="isConfirmed(item)" class="invoice-card-badge">{{ badgeText || $t('workflowWarehouse.ok') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: Record<string, any>[]
    selectedId?: string | number | null
    nameKey: string
    statusKey?: string
    confirmedStatus?: string
    badgeText?: string
  }>(),
  {
    selectedId: null,
    statusKey: '',
    confirmedStatus: 'confirm',
    badgeText: ''
  }
)

const emit = defineEmits<{
  select: [item: Record<string, any>]
}>()

function getName(item: Record<string, any>) {
  return item?.[props.nameKey]
}

function isConfirmed(item: Record<string, any>) {
  if (!props.statusKey) return false
  return item?.[props.statusKey] === props.confirmedStatus
}

function handleKeydown(event: KeyboardEvent, item: Record<string, any>) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('select', item)
  }
}
</script>

<style lang="scss" scoped>
.invoice-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-xs);
  width: 100%;
  overflow: auto;
}

.invoice-card {
  position: relative;
  overflow: hidden;
  width: 100%;
  padding: var(--app-space-xs) var(--app-space-xs);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--app-border-radius-s);
  background-color: var(--el-bg-color);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.invoice-card-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.invoice-card-name {
  font-size: 0.9375rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-card-meta {
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invoice-card-badge {
  position: absolute;
  top: -1px;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  width: 2rem;
  height: 1.45rem;
  padding: 0.2rem 0.2rem 0 0;
  border-radius: 0;
  background-color: transparent;
  color: var(--el-color-success);
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    background-color: var(--el-color-success-light-9);
    clip-path: polygon(0 0, 100% 0, 100% 100%);
  }
}
</style>
