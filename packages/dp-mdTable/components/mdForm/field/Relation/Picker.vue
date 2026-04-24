<template>
  <div class="relation-picker" @mousedown.stop @click.stop>
    <!-- 添加按钮 + 弹层 -->
    <UiPopoverDialog
      ref="popoverDialogRef"
      :width="520"
      placement="bottom-start"
      :close-on-click-outside="false"
      :offset="showSelected ? 400 : 0"
      @open="handlePopoverOpen"
      @close="handlePopoverClose"
    >
      <div class="relation-picker-dropdown" @mousedown.stop @click.stop>
        <div class="dropdown-header">
          <span class="dropdown-title">{{ $t('mdTable.relationPicker.recordsOfTable', { tableLabel: displayTableLabel }) }}</span>
        </div>
        <div class="dropdown-search">
          <ElInput
            v-model="searchKeyword"
            :placeholder="$t('mdTable.relationPicker.searchPlaceholder')"
            clearable
            class="search-input"
            @input="handleSearchInput"
          >
            <template #prefix>
              <Icon name="lucide:search" size="16" />
            </template>
          </ElInput>
          <!-- 只看已选记录 -->
          <!-- <div class="filter-row">
            <span class="filter-label">{{ $t('mdTable.relationPicker.onlySelected') }}</span>
            <ElSwitch v-model="onlySelected" />
          </div> -->
        </div>
        <div v-infinite-scroll="getRelationPickerOptions" :infinite-scroll-disabled="loading || noMore" class="dropdown-list">
          <div
            v-for="row in displayOptions"
            :key="row.id"
            class="record-card-item"
            :class="{ selected: selectedIds.includes(row.id) }"
            @click="toggleRecord(row.id)"
          >
            <MdFormFieldRelationCard :fields="fields" :data="row" @remove="toggleRecord(row.id)" />
          </div>
          <div v-if="!loading && noMore" class="list-empty">{{ $t('noMore') }}</div>
        </div>
        <!-- <div class="dropdown-footer">
          <ElButton type="primary" class="add-btn" @click="handleAddRelationRecord">
            <Icon name="lucide:plus" size="16" />
            {{ $t('mdTable.relationPicker.addRecords') }}
          </ElButton>
        </div> -->
      </div>
    </UiPopoverDialog>
    <div
      ref="triggerRef"
      tabindex="0"
      aria-label="open relation picker"
      @mousedown.capture.stop.prevent
      @mousedown.prevent.stop
      @click.stop="handleTriggerClick"
      @keydown.enter.prevent="handleTriggerClick"
    >
      <slot name="title">
        <div class="relation-add-trigger">
          <Icon name="lucide:plus" />
          <div style="height: 1rem">{{ $t('mdTable.relationPicker.addFromTable', { tableLabel: displayTableLabel }) }}</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElInput, ElSwitch, ElButton } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import type { CardViewConfig, FieldInfo } from '@packages/dp-mdTable/types/view-config'
import { generateDefaultCardConfig } from '@packages/dp-mdTable/types/view-config'
import { useDebounceFn } from '@vueuse/core'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = withDefaults(
  defineProps<{
    modelValue: string[]
    relationTableId: string
    displayFieldIds: string[]
    tableLabel: string
    multiple: boolean
    showSelected: boolean
  }>(),
  {
    tableLabel: '',
    showSelected: false
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const { t } = useI18n()
const { options, fields, searchKeyword, refresh, loading, noMore, getRelationPickerOptions } = useRelationPicker(props.relationTableId, props.displayFieldIds)

const displayTableLabel = computed(() => props.tableLabel || t('mdTable.relationPicker.defaultTableLabel'))

const popoverDialogRef = ref()
const triggerRef = ref<HTMLElement | null>(null)
const popoverVisible = ref(false)
const onlySelected = ref(false)
const selectedIds = computed(() => {
  const v = props.modelValue
  return Array.isArray(v) ? v : v ? [v] : []
})
const selectedRecordsMap = computed(() => {
  return options.value.reduce((acc: any, r: any) => {
    acc[r.id] = r
    return acc
  }, {})
})
const displayOptions = computed(() => {
  if (onlySelected.value) {
    return options.value.filter((r: any) => selectedIds.value.includes(r.id))
  }
  return options.value
})

function toggleRecord(id: string) {
  let _selectedIds = selectedIds.value
  if (selectedIds.value.includes(id)) {
    _selectedIds = selectedIds.value.filter((i) => i !== id)
  } else {
    if (!props.multiple) {
      _selectedIds = [id]
    } else {
      _selectedIds.push(id)
    }
  }
  _selectedIds = [...new Set(_selectedIds)]
  const selectedRows = options.value.filter((r: any) => _selectedIds.includes(r.id))
  emit('update:modelValue', _selectedIds, selectedRows, fields.value)
}
function handleSearchInput() {
  // TODO: implement search
  refresh()
}

function handlePopoverShow() {
  searchKeyword.value = ''
  onlySelected.value = false
}
function handlePopoverOpen() {
  popoverVisible.value = true
  handlePopoverShow()
}
function handlePopoverClose() {
  popoverVisible.value = false
}
function handleTriggerClick(event?: MouseEvent | KeyboardEvent) {
  event?.stopPropagation?.()
  if (popoverVisible.value) {
    popoverDialogRef.value?.close?.()
    return
  }
  requestAnimationFrame(() => {
    popoverDialogRef.value?.open?.()
  })
}
function handleRemove(id: string) {
  toggleRecord(id)
}

defineExpose({
  displayRecords: displayOptions
})
</script>

<style lang="scss" scoped>
.relation-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m, 12px);
}

.relation-add-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: var(--app-space-xs) var(--app-space-s);
  width: fit-content;
  border-radius: var(--app-border-radius-s);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition:
    border-color 0.2s,
    background 0.2s;

  &:hover {
    opacity: 0.8;
  }
}
</style>

<style lang="scss">
.relation-picker-dropdown {
  display: flex;
  flex-direction: column;
  height: 480px;

  .dropdown-header {
    padding: 8px 0 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .dropdown-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .dropdown-search {
    padding: 12px 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .search-input {
    width: 100%;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
  }

  .filter-label {
    flex: 1;
  }

  .dropdown-list {
    flex: 1;
    overflow-y: auto;
    height: 320px;
    padding-right: 4px;
  }

  .list-empty {
    padding: 16px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .dropdown-footer {
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    text-align: center;
  }

  .add-btn {
    width: 100%;
  }
  .record-card-item:hover {
    background: var(--el-fill-color);
  }
}
.record-card-item {
  position: relative;
  overflow: hidden;
  border-radius: var(--app-border-radius-s);
  &.selected {
    border-color: var(--el-color-primary);
    &:after {
      content: ' ';
      z-index: 1;
      left: 3px;
      top: 6px;
      width: 4px;
      height: 8px;
      position: absolute;
      display: table;
      border: 1px solid #fff;
      border-top: 0;
      border-left: 0;
      transform: rotate(45deg) scale(1) translate(-50%, -50%);
      opacity: 1;
      transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46) 0.1s;
    }
    &:before {
      content: ' ';
      z-index: 1;
      width: 31px;
      height: 31px;
      position: absolute;
      left: 0;
      top: 0;
      transform: translate(-50%, -50%) rotate(45deg);
      background-color: var(--app-primary-color);
    }
  }
}
</style>
