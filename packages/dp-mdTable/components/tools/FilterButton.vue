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
import { ref, computed } from 'vue'
import FilterConfigPopover from './FilterConfigPopover.vue'
import type { FilterRule } from './FilterConfigPopover.vue'
import type { ColumnConfig } from '../../composables/useColumns'

interface Props {
  availableColumns: ColumnConfig[]
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'filter-change', rules: FilterRule[]): void
}>()

const buttonRef = ref<HTMLElement>()
const popoverRef = ref<InstanceType<typeof FilterConfigPopover>>()

const { columnFilterRules : filterRules  } = useColumnsContext()

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.availableColumns) {
    return props.availableColumns
  }
  return []
})

// 处理按钮点击
const handleButtonClick = () => {
  if (popoverRef.value) {
    popoverRef.value.show(buttonRef.value)
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

