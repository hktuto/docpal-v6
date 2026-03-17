<template>
  <div class="filter-button-wrapper">
    <el-button
      ref="buttonRef"
      type="primary"
      @click="handleButtonClick"
    >
      {{ filterRules.length > 0 ? `${filterRules.length}个筛选` : '筛选' }}
    </el-button>
    <FilterConfigPopover
      ref="popoverRef"
      :available-columns="availableColumns"
      v-model:filter-rules="filterRules"
      width="600"
      placement="bottom-start"
      @change="handleFilterChange"
    />
  </div>
</template>

<script setup lang="ts">
import FilterConfigPopover from './FilterConfigPopover.vue'
import type { FilterRule } from './FilterConfigPopover.vue'
import type { ColumnConfig } from '../../types/column-context'

interface Props {
  availableColumns: ColumnConfig[]
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'filter-change', rules: FilterRule[]): void
}>()

const buttonRef = ref<InstanceType<typeof ElButton>>()
const popoverRef = ref<InstanceType<typeof FilterConfigPopover>>()

const { columnFilterRules : filterRules  } = useTableDataInject()

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.availableColumns) {
    return props.availableColumns
  }
  return []
})

// 处理按钮点击（传 $el 给 popover，因 ref 绑在组件上拿到的是组件实例不是 DOM）
const handleButtonClick = () => {
  if (popoverRef.value) {
    const triggerEl = buttonRef.value?.$el as HTMLElement | undefined
    popoverRef.value.show(triggerEl)
  }
}

// 处理筛选配置变化
const handleFilterChange = (rules: FilterRule[]) => {
  filterRules.value = rules
  emits('filter-change', rules)
}

// 暴露方法
defineExpose({
  filterRules,
  show: () => popoverRef.value?.show(),
  hide: () => popoverRef.value?.hide()
})
</script>

<style scoped lang="scss">
.filter-button-wrapper {
  display: inline-block;
}
</style>

