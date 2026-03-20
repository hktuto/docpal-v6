<template>
  <div class="sort-button-wrapper" v-if="sortRules">
    <el-button ref="buttonRef" type="primary" @click="handleButtonClick">
      <el-icon class="sort-icon">
        <Sort />
      </el-icon>
      {{ sortRules.length > 0 ? `${sortRules.length} 个排序` : '排序' }}
    </el-button>
    <ToolsSortConfigPopover
      ref="popoverRef"
      :available-columns="availableColumns"
      width="600"
      placement="bottom-start"
      @change="handleSortChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sort } from '@element-plus/icons-vue'
import type { SortRule } from './sort/configPopover.vue'
import type { ColumnConfig } from '../../types/column-context'

interface Props {
  availableColumns: ColumnConfig[]
}
const gridRef = useMDTableInject()
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'sort-change', rules: SortRule[]): void
}>()

const buttonRef = ref<HTMLElement>()
const popoverRef = ref()
const { columnSortRules: sortRules } = useMDTableInject()

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.availableColumns) {
    const availableColumns = props.availableColumns.filter((column) => sortRules.value.some((sort) => sort.field === column.field))
    return props.availableColumns
  }
  return []
})

// 处理按钮点击
const handleButtonClick = () => {
  if (popoverRef.value) {
    popoverRef.value.show(buttonRef.value.$el)
  }
}

// 处理排序配置变化
const handleSortChange = () => {
  console.log('handleSortChange', sortRules.value)
  emits('sort-change', sortRules.value)
}

</script>

<style scoped lang="scss">
.sort-button-wrapper {
  display: inline-block;

  .sort-icon {
    margin-right: 4px;
  }
}
</style>
