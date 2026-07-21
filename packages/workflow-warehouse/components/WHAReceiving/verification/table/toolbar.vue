<template>
  <div class="toolbar">
    <div class="status-tabs" role="tablist" aria-label="Verification status filter">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        tabindex="0"
        :aria-selected="modelValue === tab.value"
        :class="['status-tab', { active: modelValue === tab.value }]"
        @click="emit('update:modelValue', tab.value)"
        @keydown.enter="emit('update:modelValue', tab.value)"
      >
        {{ tab.label }} ({{ counts[tab.value] }})
      </button>
    </div>
    <el-input
      :model-value="search"
      clearable
      class="search-input"
      placeholder="Search KOA, customer PN, carton..."
      :prefix-icon="Search"
      aria-label="Search items"
      @update:model-value="emit('update:search', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import type { VerificationStatusFilter } from '../../../../composables/useWHAReceivingVerificationTable'

defineProps<{
  modelValue: VerificationStatusFilter
  search: string
  counts: Record<VerificationStatusFilter, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: VerificationStatusFilter]
  'update:search': [value: string]
}>()

const tabs: { label: string; value: VerificationStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unverified', value: 'unVerified' },
  { label: 'OK', value: 'ok' }
]
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-sm);
  width: 100%;
}

.status-tabs {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: var(--app-space-xs);
}

.status-tab {
  border: none;
  background: transparent;
  padding: 4px 8px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 13px;
  border-radius: 4px;

  &.active {
    color: var(--el-color-primary);
    font-weight: 600;
    background: var(--el-color-primary-light-9);
  }

  &:hover {
    color: var(--el-color-primary);
  }
}

.search-input {
  width: 280px;
  max-width: 40%;
}
</style>
