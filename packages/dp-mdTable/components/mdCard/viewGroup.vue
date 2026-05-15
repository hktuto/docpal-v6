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

const { columns, tableFields, tableData, columnGroupRules, getAggChildData } = useMDCardInject()

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
  return column?.field_name_alias || column?.title || activeGroupField.value || '分组'
})

function getGroupKey(row: any, index: number) {
  const field = activeGroupField.value
  const value = field ? row?.[field] : row?.id
  return `${field || 'group'}:${value ?? '__empty__'}:${index}`
}

function getGroupValue(row: any) {
  const field = activeGroupField.value
  return field ? row?.[field] : row?.id
}

function getGroupCount(row: any) {
  return row?.__count ?? row?.count ?? ''
}

function updateRow(rowId: string, data: any) {
  const nextGroupChildren = Object.entries(groupChildren.value).reduce<Record<string, any[]>>((acc, [key, rows]) => {
    acc[key] = rows.map((row) => (row?.id === rowId ? { ...row, ...data } : row))
    return acc
  }, {})
  groupChildren.value = nextGroupChildren
}

function isGroupExpanded(row: any, index: number) {
  return expandedGroupKeys.value.includes(getGroupKey(row, index))
}

function isGroupLoading(row: any, index: number) {
  return loadingGroupKeys.value.includes(getGroupKey(row, index))
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

async function handleToggleGroup(row: any, index: number) {
  const key = getGroupKey(row, index)
  if (expandedGroupKeys.value.includes(key)) {
    updateKeyList(expandedGroupKeys, key, false)
    return
  }
  updateKeyList(expandedGroupKeys, key, true)
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

function handleOpenRecord(row: any) {
  emit('open-record', row)
}

function handleRowContextMenu(row: any, event: MouseEvent) {
  emit('row-context-menu', row, event)
}

watch(
  () => [activeGroupField.value, tableData.value],
  () => {
    groupChildren.value = {}
    expandedGroupKeys.value = []
    loadingGroupKeys.value = []
  }
)

defineExpose({
  updateRow
})
</script>

<template>
  <div class="md-card-list-scroll">
    <template v-if="tableData?.length > 0">
      <section v-for="(group, groupIndex) in tableData" :key="getGroupKey(group, groupIndex)" class="md-card-group">
        <MdCardViewGroupHeader
          :title="activeGroupTitle"
          :value="getGroupValue(group)"
          :count="getGroupCount(group)"
          :expanded="isGroupExpanded(group, groupIndex)"
          :loading="isGroupLoading(group, groupIndex)"
          @toggle="handleToggleGroup(group, groupIndex)"
        />
        <div v-if="isGroupExpanded(group, groupIndex)" class="md-card-group-body">
          <div v-if="groupChildren[getGroupKey(group, groupIndex)]?.length > 0" class="card-grid" :style="gridStyle">
            <div v-for="(row, rowIndex) in groupChildren[getGroupKey(group, groupIndex)]" :key="row?.id || rowIndex" class="md-card-draggable-item">
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
          <el-empty v-else-if="!isGroupLoading(group, groupIndex)" class="md-card-group-empty" description="暂无记录" />
        </div>
      </section>
    </template>
    <el-empty v-else description="暂无分组" />
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
