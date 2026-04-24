<template>
  <div class="relation-picker">
    <!-- 添加按钮 + 弹层 -->
    <ElPopover
      v-model:visible="popoverVisible"
      :width="520"
      placement="bottom-start"
      trigger="click"
      :popper-class="`relation-picker-popover ${showSelected ? '' : 'vxe-table--ignore-clear'}`"
      @show="handlePopoverShow"
    >
      <template #default>
        <div class="relation-picker-dropdown">
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
            <div class="filter-row">
              <span class="filter-label">{{ $t('mdTable.relationPicker.onlySelected') }}</span>
              <ElSwitch v-model="onlySelected" />
            </div>
          </div>
          <div v-loading="listLoading" class="dropdown-list">
            <div
              v-for="row in displayOptions"
              :key="row.id"
              class="record-card-item"
              :class="{ selected: selectedIds.includes(row.id) }"
              @click="toggleRecord(row.id)"
            >
              <MdFormFieldRelationCard :fields="fields" :data="row" />
            </div>
            <div v-if="displayOptions.length === 0 && !listLoading" class="list-empty">{{ $t('mdTable.relationPicker.noRecords') }}</div>
          </div>
          <div class="dropdown-footer">
            <ElButton type="primary" class="add-btn" @click="handleAddRelationRecord">
              <Icon name="lucide:plus" size="16" />
              {{ $t('mdTable.relationPicker.addRecords') }}
            </ElButton>
          </div>
        </div>
      </template>
      <template #reference>
        <slot name="title">
          <div class="relation-add-trigger">
            <Icon name="lucide:plus" />
            <div style="height: 1rem">{{ $t('mdTable.relationPicker.addFromTable', { tableLabel: displayTableLabel }) }}</div>
          </div>
        </slot>
      </template>
    </ElPopover>

    <!-- 已选卡片列表 -->
    <div v-if="selectedIds.length > 0 && showSelected" class="selected-cards">
      <div v-for="id in selectedIds" :key="id" class="selected-card-body">
        <template v-if="selectedRecordsMap[id]">
          <MdFormFieldRelationCard class="record-card-item" :fields="fields" :data="selectedRecordsMap[id]" :show-remove="true" @remove="handleRemove(id)" />
        </template>
        <div v-else-if="id" class="selected-card-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ $t('mdTable.relationPicker.loading') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElPopover, ElInput, ElSwitch, ElCheckbox, ElButton, ElSkeleton } from 'element-plus'
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
const { options, fields, searchKeyword } = useRelationPicker(props.relationTableId, props.displayFieldIds)

const displayTableLabel = computed(() => props.tableLabel || t('mdTable.relationPicker.defaultTableLabel'))

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
}

function handlePopoverShow() {
  searchKeyword.value = ''
  onlySelected.value = false
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
.relation-picker-popover {
  .relation-picker-dropdown {
    display: flex;
    flex-direction: column;
    max-height: 480px;
  }

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
    max-height: 320px;
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
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
  background: var(--el-fill-color-light);
  border-radius: var(--app-border-radius-s);
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;

  position: relative;
  overflow: hidden;
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
