<template>
  <div class="sort-button-wrapper" v-if="sortRules">
    <el-button ref="buttonRef" type="primary" @click="handleButtonClick">
      <el-icon class="sort-icon">
        <Sort />
      </el-icon>
      {{ sortRules.length > 0 && sortRules.some((rule) => rule.field) ? `${sortRules.length} 个排序` : '排序' }}
    </el-button>
    <SortConfigPopover
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

import SortConfigPopover from './configPopover.vue'
import { useMDCalendarInject } from '../../../../composables/mdCalendar/useMDCalendar'


interface Props {
  availableColumns: any[]
}
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'sort-change', rules: any[]): void
}>()

const buttonRef = ref<HTMLElement>()
const popoverRef = ref()
const { columnSortRules: sortRules } = useMDCalendarInject()

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.availableColumns ) {
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
