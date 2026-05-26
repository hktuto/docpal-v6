<script setup lang="ts">
import type { Ref } from 'vue'
import MdCardWidget from './widget.vue'
import MdCardViewGroupHeader from './viewGroupHeader.vue'

interface CardWidgetStyle {
  showCover: boolean
  coverField?: string
  stretchCover: boolean
  showFieldName: boolean
  bordered: boolean
  compact: boolean
  shadow: 'none' | 'small' | 'hover'
  cardCount: number
}

defineProps<{
  styleConfig: CardWidgetStyle
  gridStyle: Record<string, string>
}>()

const emit = defineEmits<{
  'open-record': [row: any]
  'row-context-menu': [row: any, event: MouseEvent]
}>()

const { columns, tableFields, tableData, columnGroupRules, getAggChildData, syncRowAndGroupAncestors } = useMDCardInject()
const { t } = useI18n()

/** 用于丢弃过期的列表刷新请求（快速连刷或切换分组时） */
let tableDataReloadSeq = 0

const groupChildren = ref<Record<string, any[]>>({})
const expandedGroupKeys = ref<string[]>([])
const loadingGroupKeys = ref<string[]>([])
const groupRules = computed(() => columnGroupRules?.value || [])
const activeGroupRule = computed(() => groupRules.value[0])
const activeGroupField = computed(() => activeGroupRule.value?.field || '')
const activeGroupColumn = computed(() => {
  const field = activeGroupField.value
  if (!field) {
    return null
  }
  const allColumns = [...(columns?.value || []), ...(tableFields?.value || [])]
  return allColumns.find((column: any) => {
    return column?.field_name === field || column?.field === field
  })
})
const activeGroupTitle = computed(() => {
  const column = activeGroupColumn.value
  return column?.field_name_alias || column?.title || activeGroupField.value || undefined
})

function getGroupValue(row: any) {
  const field = activeGroupField.value
  return field ? row?.[field] : row?.id
}

function normalizeGroupValueForKey(value: unknown) {
  if (value === null || value === undefined) {
    return '__empty__'
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return '__object__'
    }
  }
  return String(value)
}

/** 与分组值绑定，刷新后仍可对上同一逻辑分组（不使用列表下标） */
function getStableGroupKey(row: any) {
  const field = activeGroupField.value
  const value = getGroupValue(row)
  return `${field || 'group'}:${normalizeGroupValueForKey(value)}`
}

function getGroupCount(row: any) {
  return row?.__count ?? row?.count ?? ''
}

async function syncAfterEdit(rowId: string) {
  await syncRowAndGroupAncestors(rowId, { groupChildren })
}

function isGroupExpanded(row: any) {
  return expandedGroupKeys.value.includes(getStableGroupKey(row))
}

function isGroupLoading(row: any) {
  return loadingGroupKeys.value.includes(getStableGroupKey(row))
}

function updateKeyList(keysRef: Ref<string[]>, key: string, selected: boolean) {
  if (selected) {
    if (!keysRef.value.includes(key)) {
      keysRef.value = [...keysRef.value, key]
    }
    return
  }
  keysRef.value = keysRef.value.filter((item) => item !== key)
}

async function loadGroupChildrenForRow(row: any) {
  const key = getStableGroupKey(row)
  if (groupChildren.value[key]) {
    return
  }
  updateKeyList(loadingGroupKeys, key, true)
  try {
    const rows = await getAggChildData?.({ ...row, __level: 0 })
    groupChildren.value = {
      ...groupChildren.value,
      [key]: rows || []
    }
  } finally {
    updateKeyList(loadingGroupKeys, key, false)
  }
}

async function handleToggleGroup(row: any) {
  const key = getStableGroupKey(row)
  if (expandedGroupKeys.value.includes(key)) {
    updateKeyList(expandedGroupKeys, key, false)
    return
  }
  updateKeyList(expandedGroupKeys, key, true)
  await loadGroupChildrenForRow(row)
}

function handleOpenRecord(row: any) {
  emit('open-record', row)
}

function handleRowContextMenu(row: any, event: MouseEvent) {
  emit('row-context-menu', row, event)
}

watch(
  () => activeGroupField.value,
  () => {
    tableDataReloadSeq += 1
    groupChildren.value = {}
    expandedGroupKeys.value = []
    loadingGroupKeys.value = []
  }
)

watch(
  () => tableData.value,
  async (rows) => {
    if (!activeGroupField.value) {
      return
    }
    const seq = (tableDataReloadSeq += 1)
    const data = rows || []
    const validKeys = new Set(data.map((row: any) => getStableGroupKey(row)))
    expandedGroupKeys.value = expandedGroupKeys.value.filter((key) => validKeys.has(key))

    const prevChildren = { ...groupChildren.value }
    const nextChildren: Record<string, any[]> = {}
    for (const key of Object.keys(prevChildren)) {
      if (validKeys.has(key)) {
        nextChildren[key] = prevChildren[key]
      }
    }
    groupChildren.value = nextChildren

    const keysToReload = [...expandedGroupKeys.value]
    for (const key of keysToReload) {
      if (seq !== tableDataReloadSeq) {
        return
      }
      const row = data.find((r: any) => getStableGroupKey(r) === key)
      if (!row) {
        continue
      }
      try {
        const childRows = await getAggChildData?.({ ...row, __level: 0 })
        if (seq !== tableDataReloadSeq) {
          return
        }
        groupChildren.value = {
          ...groupChildren.value,
          [key]: childRows || []
        }
      } catch {
        // 保持旧子列表，避免无感刷新时闪空或闪错
      }
    }
  }
)

defineExpose({
  syncAfterEdit
})
</script>

<template>
  <div class="md-card-list-scroll">
    <template v-if="tableData?.length > 0">
      <section v-for="(group, groupIndex) in tableData" :key="`${getStableGroupKey(group)}-${groupIndex}`" class="md-card-group">
        <MdCardViewGroupHeader
          :title="activeGroupTitle"
          :value="getGroupValue(group)"
          :count="getGroupCount(group)"
          :expanded="isGroupExpanded(group)"
          :loading="isGroupLoading(group)"
          @toggle="handleToggleGroup(group)"
        />
        <div v-if="isGroupExpanded(group)" class="md-card-group-body">
          <div v-if="groupChildren[getStableGroupKey(group)]?.length > 0" class="card-grid" :style="gridStyle">
            <div v-for="(row, rowIndex) in groupChildren[getStableGroupKey(group)]" :key="row?.id || rowIndex" class="md-card-draggable-item">
              <MdCardWidget
                :row="row"
                :fields="columns"
                :style-config="styleConfig"
                :draggable="false"
                @open-record="handleOpenRecord"
                @row-context-menu="handleRowContextMenu"
              />
            </div>
          </div>
          <el-empty v-else-if="!isGroupLoading(group)" class="md-card-group-empty" :description="t('mdTable.cardGroup.emptyChildren')" />
        </div>
      </section>
    </template>
    <el-empty v-else :description="t('mdTable.cardGroup.emptyGroups')" />
  </div>
</template>

<style scoped lang="scss">
.md-card-list-scroll {
  flex: 1;
  min-height: 0;
  padding: var(--app-space-s);
  overflow: auto;
}

.card-grid {
  display: grid;
  gap: 12px;
  align-items: stretch;
}

.md-card-draggable-item {
  display: flex;
  width: 100%;
  height: 100%;
}

.md-card-draggable-item :deep(.md-card-widget) {
  width: 100%;
  flex: 1;
}
</style>
