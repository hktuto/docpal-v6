<template>
  <div class="toolbar">
    <div class="toolbar-left">
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
      <el-button
        type="primary"
        :loading="creatingRow"
        :disabled="disabled"
        :aria-label="t('common_add')"
        @click="emit('add-row')"
      >
        {{ t('common_add') }}
      </el-button>
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
import type { VerificationStatusFilter } from '../../utils/tableHelper'

export type StatusTab = {
  label: string
  value: VerificationStatusFilter
}

const props = defineProps<{
  modelValue: VerificationStatusFilter
  search: string
  counts: Record<VerificationStatusFilter, number>
  disabled?: boolean
  creatingRow?: boolean
  tabs?: StatusTab[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: VerificationStatusFilter]
  'update:search': [value: string]
  'add-row': []
}>()

const { t } = useI18n()

const tabs = computed(
  () =>
    props.tabs ?? [
      { label: t('All'), value: 'all' as VerificationStatusFilter },
      { label: t('workflowWarehouse.unverified'), value: 'unVerified' as VerificationStatusFilter },
      { label: t('workflowWarehouse.ok'), value: 'ok' as VerificationStatusFilter }
    ]
)
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-m);
  width: 100%;
  padding: var(--app-space-s) var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--app-space-s);
  min-width: 0;
}

.status-tabs {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: var(--app-border-radius-s);
  background-color: var(--el-fill-color-light);
}

.status-tab {
  border: none;
  background: transparent;
  padding: 6px 12px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.2;
  border-radius: calc(var(--app-border-radius-s) - 1px);
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;

  &.active {
    color: var(--el-color-primary);
    font-weight: 600;
    background-color: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-lighter);
  }

  &:hover:not(.active) {
    color: var(--el-color-primary);
  }
}

.search-input {
  width: 280px;
  max-width: 40%;
}
</style>
