<template>
  <div :class="{ 'md-table-header': true, ellipsis: true, [headerAlign]: true }" @contextmenu.prevent="handleContextMenu">
    <div class="title">{{ column.title }}</div>
    <div class="mdTableHeader-trigger" ref="triggerRef" @click="handleClick(triggerRef)">
      <SvgIcon src="/icons/tools/more.svg" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMDTableInject } from '../../../composables/useMDTable'

const props = defineProps<{
  column: any
  headerProps: any
}>()
const mdTableHeaderPopover = inject('mdTableHeaderPopover')
const mdTable = useMDTableInject()
const triggerRef = ref()

const headerAlign = computed(() => {
  return props.column.headerAlign || 'left'
})

/**
 * 从 columns 中获取完整的列配置（包含 properties）
 */
function getFullColumnConfig() {
  if (!props.column?.field) {
    return props.column
  }

  // 从 columns 中查找对应的列配置
  const fullColumn = mdTable.columns.value.find((col: any) => col.field === props.column.field)

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
  mdTableHeaderPopover?.value?.open(htmlElement, fullColumn)
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
    }
  }
  .title {
    margin-left: var(--app-space-xs);
    flex: 1 0 auto;
    text-align: var(--align);
    line-height: 1.2;
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
