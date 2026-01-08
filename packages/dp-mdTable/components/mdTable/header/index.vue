<template>
  <div class="md-table-header" @click="handleClick">
    {{ column.title }}
    <div class="mdTableHeader-trigger" ref="triggerRef">
      <SvgIcon src="/icons/tools/more.svg" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMDTableReJect } from '../../../composables/useMDTable'

const props = defineProps<{
  column: any
  headerProps: any
}>()
const mdTableHeaderPopover = inject('mdTableHeaderPopover')
const mdTable = useMDTableReJect()
const triggerRef = ref()

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

function handleClick() {
  const fullColumn = getFullColumnConfig()
  console.log('handleClick - fullColumn with properties:', {
    field: fullColumn.field,
    title: fullColumn.title,
    type: fullColumn.type,
    properties: fullColumn.properties
  })
  mdTableHeaderPopover?.value?.open(triggerRef.value, fullColumn)
}
</script>
<style scoped lang="scss">
.md-table-header {
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  .mdTableHeader-trigger {
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
