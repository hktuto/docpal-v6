<template>
  <div class="relation-picker">
    <!-- 添加按钮 + 弹层 -->
    <ElPopover
      v-model:visible="popoverVisible"
      :width="520"
      placement="bottom-start"
      trigger="click"
      :popper-class="`relation-picker-popover ${mode === 'card' ? '' : 'vxe-table--ignore-clear'}`"
      @show="handlePopoverShow"
    >
      <template #default>
        <div class="relation-picker-dropdown">
          <div class="dropdown-header">
            <span class="dropdown-title">{{ $t('mdTable.relationPicker.recordsOfTable', { tableLabel: displayTableLabel }) }}</span>
          </div>
          <div class="dropdown-search">
            <ElInput v-model="searchKeyword" :placeholder="$t('mdTable.relationPicker.searchPlaceholder')" clearable class="search-input" @input="handleSearchInput">
              <template #prefix>
                <Icon name="lucide:search" size="16" />
              </template>
            </ElInput>
            <div class="filter-row">
              <span class="filter-label">{{ $t('mdTable.relationPicker.onlySelected') }}</span>
              <ElSwitch v-model="onlySelected" />
            </div>
          </div>
          <div v-loading="listLoading" class="dropdown-list" @scroll="handleListScroll">
            <div v-for="row in displayList" :key="row.id" class="record-card-item" :class="{ selected: pendingSet.has(row.id) }" @click="toggleRecord(row.id)">
              <MdFormFieldRelationCard :config="cardConfig || defaultCardConfig" :fields="targetFields" :sample-data="row" />
            </div>
            <div v-if="displayList.length === 0 && !listLoading" class="list-empty">{{ $t('mdTable.relationPicker.noRecords') }}</div>
          </div>
          <div class="dropdown-footer">
            <ElButton type="primary" class="add-btn" @click="handleConfirmAdd">
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
    <div v-if="selectedIds.length > 0 && mode === 'card'" class="selected-cards">
      <div v-for="id in selectedIds" :key="id" class="selected-card-body">
        <template v-if="selectedRecordsMap[id]">
          <MdFormFieldRelationCard
            class="record-card-item"
            :config="cardConfig || defaultCardConfig"
            :fields="targetFields"
            :cover-field="coverField"
            :sample-data="selectedRecordsMap[id]"
            :show-remove="true"
            @remove="handleRemove(id)"
            @original-click="handleOriginalClick"
          />
        </template>
        <div v-else class="selected-card-loading">
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
    tableLabel: string
    mode: 'card' | ''
  }>(),
  {
    tableLabel: '',
    mode: 'card'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void,
  (e: 'original-click'): void
}>()

const { t } = useI18n()
const { queryRelatedTable, getTableCardConfig, getFieldsForTable, getRecordById } = useColumnsInject()

const displayTableLabel = computed(() => props.tableLabel || t('mdTable.relationPicker.defaultTableLabel'))

const popoverVisible = ref(false)
const searchKeyword = ref('')
const onlySelected = ref(false)
const listLoading = ref(false)
const optionsList = ref<any[]>([])
const pageNum = ref(1)
const pageSize = 50
const hasMore = ref(true)
const searchFetched = ref(false)

const cardConfig = ref<CardViewConfig | null>(null)
const targetFields = ref<FieldInfo[]>([])
const coverField = ref<string | undefined>(undefined)
const defaultCardConfig = computed(() => {
  if (targetFields.value.length === 0) return { fields: [], titleField: undefined }
  return generateDefaultCardConfig(targetFields.value)
})

const selectedIds = computed(() => {
  const v = props.modelValue
  return Array.isArray(v) ? v : v ? [v] : []
})

const pendingSelection = ref<string[]>([])
const pendingSet = computed(() => new Set(pendingSelection.value))

const displayList = computed(() => {
  const list = optionsList.value
  if (onlySelected.value) {
    return list.filter((r: any) => pendingSet.value.has(r.id))
  }
  return list
})

const selectedRecordsMap = ref<Record<string, any>>({})
function handleClick(id: string) {
  emit('original-click', id)
}
async function loadCardConfigAndFields() {
  if (!props.relationTableId || !getTableCardConfig || !getFieldsForTable) return
  try {
    const [config, fields] = await Promise.all([getTableCardConfig(props.relationTableId), getFieldsForTable(props.relationTableId)])
    cardConfig.value = config || null
    if (!config) {
      const imageIndex = fields.findIndex((f) => f.type === ColumnFieldType.Document)
      if (imageIndex !== -1) {
        coverField.value = fields[imageIndex].fieldName
        fields.splice(imageIndex, 1)
      }
      targetFields.value = fields.filter((f) => !f.hidden && f.fieldName).slice(0, 5)
    }
  } catch (e) {
    console.error('Load card config/fields failed:', e)
  }
}

async function fetchList(keyword: string, reset: boolean) {
  if (!queryRelatedTable || !props.relationTableId) return
  if (reset) {
    pageNum.value = 1
    optionsList.value = []
    hasMore.value = true
  }
  if (!hasMore.value && !reset) return
  listLoading.value = true
  try {
    const result = await queryRelatedTable(props.relationTableId, {
      keyword: keyword || '',
      pageNum: pageNum.value,
      pageSize,
      sortBy: 'id',
      sortOrder: 'asc'
    })
    const rows = result?.rows || []
    if (reset) {
      optionsList.value = rows
    } else {
      const existIds = new Set(optionsList.value.map((r: any) => r.id))
      optionsList.value.push(...rows.filter((r: any) => !existIds.has(r.id)))
    }
    hasMore.value = rows.length === pageSize
  } catch (e) {
    console.error('Query related table failed:', e)
  } finally {
    listLoading.value = false
  }
}

const debouncedFetch = useDebounceFn((keyword: string, reset: boolean) => {
  fetchList(keyword, reset)
}, 300)

function handleSearchInput() {
  debouncedFetch(searchKeyword.value, true)
}

function handleListScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20 && !listLoading.value && hasMore.value) {
    pageNum.value++
    fetchList(searchKeyword.value, false)
  }
}

function toggleRecord(id: string) {
  const set = new Set(pendingSelection.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  pendingSelection.value = Array.from(set)
}

function handleConfirmAdd() {
  const ids = [...pendingSelection.value]
  const fromList = optionsList.value.filter((r: any) => ids.includes(r.id))
  if (fromList.length) {
    const next = { ...selectedRecordsMap.value }
    fromList.forEach((r: any) => { next[r.id] = r })
    selectedRecordsMap.value = next
  }
  emit('update:modelValue', ids)
  popoverVisible.value = false
}

function handleRemove(id: string) {
  emit(
    'update:modelValue',
    selectedIds.value.filter((i) => i !== id)
  )
}
function handleOriginalClick(record: any) {
  emit('original-click', record)
}
function handlePopoverShow() {
  pendingSelection.value = [...selectedIds.value]
  searchKeyword.value = ''
  onlySelected.value = false
  pageNum.value = 1
  optionsList.value = []
  hasMore.value = true
  loadCardConfigAndFields().then(() => {
    if (!searchFetched.value) {
      fetchList('', true)
      searchFetched.value = true
    } else {
      fetchList(searchKeyword.value, true)
    }
  })
}

async function loadSelectedRecords() {
  const ids = selectedIds.value
  if (ids.length === 0 || !getRecordById) {
    selectedRecordsMap.value = {}
    return
  }
  const map: Record<string, any> = {}
  await Promise.all(
    ids.map(async (id) => {
      const record = await getRecordById?.(props.relationTableId, id)
      if (record) map[id] = record
    })
  )
  selectedRecordsMap.value = map
}

watch(
  () => [...selectedIds.value],
  () => {
    loadSelectedRecords()
  },
  { immediate: true }
)

watch(
  () => props.relationTableId,
  () => {
    loadCardConfigAndFields()
    loadSelectedRecords()
  },
  {
    immediate: true
  }
)
defineExpose({
  displayRecords: displayList,
  selectedRecordsMap
})
</script>

<style lang="scss" scoped>
.relation-picker {
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

.selected-cards {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s, 8px);
}

.selected-card-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: var(--app-space-m, 12px);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--app-border-radius-s);
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

  .list-loading,
  .list-empty {
    padding: 16px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .card-item-check {
    flex-shrink: 0;
    padding-top: 2px;
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
