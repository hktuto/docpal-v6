<template>
  <div :class="{ 'md-table-header': true, ellipsis: true, [headerAlign]: true }" @contextmenu.prevent="handleContextMenu">
    <!-- Column type indicator -->
    <div v-if="columnIndicator" class="column-indicator" :title="columnIndicator.tooltip">
      <Icon :name="columnIndicator.icon" :class="columnIndicator.class" />
    </div>
    <div class="title">
      {{ column.title }}

      <div
        v-if="suggestionCount > 0"
        class="suggestion-badge"
        :title="`${suggestionCount} relation suggestion${suggestionCount > 1 ? 's' : ''} available`"
        @click.stop="handleSuggestionClick"
        ref="suggestionBadgeRef"
      >
        <Icon name="lucide:sparkles" class="sparkle-icon" />
        <span class="badge-count">{{ suggestionCount }}</span>
      </div>
    </div>

    <!-- Suggestion badge -->

    <div class="mdTableHeader-trigger" ref="triggerRef" @click="handleClick(triggerRef)">
      <SvgIcon src="/icons/tools/more.svg" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMDTableInject } from '../../../composables/useMDTable'
import { getColumnHeaderIndicator } from '../addColumn/columnBasic'
import { ColumnFieldType } from '../../../types/column-types'
const props = defineProps<{
  column: any
  headerProps: any
}>()
const mdTableHeaderPopover = inject<Ref<any>>('mdTableHeaderPopover')
const mdTable = useMDTableInject()
const triggerRef = ref()
const suggestionBadgeRef = ref()

// Inject column suggestions context (provided by TableDetailView)
// We receive the ref directly to maintain reactivity
const columnSuggestions = inject<{
  suggestionsByField: Ref<Map<string, { count: number; fieldId: string }>>
  openSuggestionPopover: (fieldName: string, fieldId: string, target: HTMLElement) => void
} | null>('columnSuggestions', null)

const headerAlign = computed(() => {
  return props.column.headerAlign || 'left'
})

/**
 * Get suggestion count for this column
 * Accesses suggestionsByField.value directly to maintain reactivity
 */
const suggestionCount = computed(() => {
  if (!columnSuggestions || !props.column?.field) return 0

  // Don't show suggestions for virtual columns or relation columns
  const field = props.column.field
  if (field.includes('.')) return 0 // Virtual column
  const columnType = props.column?.type || props.column?.cellRender?.name
  if (columnType === 14 || columnType === 'MagicLink') return 0 // Already a relation

  // Access the ref's value directly to establish reactive dependency
  const suggestion = columnSuggestions.suggestionsByField.value.get(field)
  return suggestion?.count || 0
})

/**
 * Handle click on suggestion badge
 */
function handleSuggestionClick() {
  if (!columnSuggestions || !props.column?.field) return

  const suggestion = columnSuggestions.suggestionsByField.value.get(props.column.field)
  if (!suggestion?.fieldId) return

  columnSuggestions.openSuggestionPopover(props.column.field, suggestion.fieldId, suggestionBadgeRef.value)
}

/**
 * 表头列类型角标：配置见 addColumn/columnBasic.ts 各字段的 headerIndicator
 */
const columnIndicator = computed(() => {
  const fullColumn = mdTable.columns.value.find((col: any) => col.field_name === props.column.field)
  // 删除列后 columns 已更新但表头可能仍短暂渲染：必须用 null，避免 `{}` 让 v-if 为真进而把 undefined 传给 Icon（会触发 name.startsWith 报错）
  if (!fullColumn) return null
  if (fullColumn.business_type === ColumnFieldType.VirtualColumn) {
    const relation_field_name = fullColumn.display_structure.relation_field_name
    const relation_field = mdTable.columns.value.find((col: any) => col.field_name === relation_field_name)
    if (relation_field) {
      fullColumn.display_structure.relation_field_name_alias = relation_field.field_name_alias
    }
  }
  const columnIndicator = getColumnHeaderIndicator(fullColumn?.business_type, fullColumn.display_structure || {})
  return columnIndicator
})

/**
 * 从 columns 中获取完整的列配置（包含 properties）
 */
function getFullColumnConfig() {
  if (!props.column?.field) {
    return props.column
  }

  // 从 columns 中查找对应的列配置
  const fullColumn = mdTable.columns.value.find((col: any) => col.field_name === props.column.field)
  if (fullColumn) {
    // 合并 vxe-table 传递的 column 和完整的列配置
    // 优先使用 fullColumn 的 properties，确保获取到完整的自定义属性
    return {
      ...fullColumn,
      ...props.column,
      // 确保 properties 优先使用完整列配置中的值
      properties: fullColumn.properties || props.column.properties || props.column.cellRender?.props || props.column.editRender?.props || {}
    }
  }

  // 如果找不到，返回原始 column，但尝试从 cellRender/editRender 中提取 properties
  return {
    ...props.column,
    properties: props.column.properties || props.column.cellRender?.props || props.column.editRender?.props || {}
  }
}
const handleContextMenu = (event: MouseEvent) => {
  handleClick(event.target as HTMLElement)
  mdTable.clearCheckboxRow()
}
function handleClick(htmlElement: HTMLElement) {
  const fullColumn = getFullColumnConfig()
  mdTableHeaderPopover.value?.open(htmlElement, fullColumn)
}
</script>
<style scoped lang="scss">
.md-table-header {
  --align: left;
  height: 100%;
  display: inline-flex;
  overflow: hidden;
  width: 100%;
  gap: var(--app-space-xs);
  padding: 0 var(--app-space-xs);
  &.right {
    --align: right;
  }
  &.ellipsis {
    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      padding-right: var(--app-space-s);
    }
  }
  .column-indicator {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    font-size: 14px;

    .indicator-relation {
      color: var(--el-color-primary);
    }

    .indicator-virtual {
      color: var(--el-color-warning);
    }
  }
  .title {
    margin-left: var(--app-space-xs);
    flex: 1 0 auto;
    text-align: var(--align);
    line-height: 1.2;
  }
  .suggestion-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px 6px;
    background: var(--app-accent-color);
    border-radius: 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s ease;

    .sparkle-icon {
      font-size: 12px;
      color: white;
    }

    .badge-count {
      font-size: 11px;
      font-weight: 600;
      color: white;
      line-height: 1;
    }

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(var(--el-color-warning-rgb), 0.4);
    }
  }

  .mdTableHeader-trigger {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    display: grid;
    place-items: center;
    cursor: pointer;
    opacity: 0;
  }
  &:hover {
    .mdTableHeader-trigger {
      opacity: 1;
    }
  }
}
</style>
