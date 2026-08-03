<template>
  <div class="toolbar">
    <div class="status-tabs" role="tablist" :aria-label="$t('workflowWarehouse.statusFilterAria')">
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
      :placeholder="$t('search.text')"
      :prefix-icon="Search"
      :aria-label="$t('workflowWarehouse.searchItemsAria')"
      @update:model-value="emit('update:search', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'
import type { VerificationStatusFilter } from '../../../../composables/useWHASupplyListVerifyTable'

defineProps<{
  modelValue: VerificationStatusFilter
  search: string
  counts: Record<VerificationStatusFilter, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: VerificationStatusFilter]
  'update:search': [value: string]
}>()

const { t } = useI18n()

const tabs = computed(() => [
  { label: t('All'), value: 'all' as VerificationStatusFilter },
  { label: t('workflowWarehouse.unverified'), value: 'unVerified' as VerificationStatusFilter },
  { label: t('workflowWarehouse.ok'), value: 'ok' as VerificationStatusFilter }
])
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
