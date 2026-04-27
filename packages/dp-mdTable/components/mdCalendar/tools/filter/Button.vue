<template>
  <div class="filter-button-wrapper">
    <el-button ref="buttonRef" type="primary" @click="handleButtonClick">
      {{ columnFilterRules && columnFilterRules?.conditions?.length > 0 ? `${columnFilterRules?.conditions?.length}个筛选` : '筛选' }}
    </el-button>
    <FilterConfigPopover ref="popoverRef" :available-columns="canFilterColumns" width="600" placement="bottom-start" @filter-change="handleFilterChange" />
  </div>
</template>

<script setup lang="ts">
import FilterConfigPopover, { type FilterRule } from './ConfigPopover.vue'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { useMDCalendarInject } from '../../../../composables/mdCalendar/useMDCalendar'
interface Props {
  availableColumns: any[]
}
const canFilterColumns = computed(() => {
  if (!props.availableColumns) return []
  return props.availableColumns.filter(
    (col) => ![ColumnFieldType.Relation, ColumnFieldType.VirtualColumn, ColumnFieldType.Formula, ColumnFieldType.AggVirtualColumn].includes(col.business_type)
  )
})
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'filter-change', rules: FilterRule[]): void
}>()

const buttonRef = ref<InstanceType<typeof ElButton>>()
const popoverRef = ref<InstanceType<typeof FilterConfigPopover>>()

const { columnFilterRules } = useMDCalendarInject()

// 处理按钮点击（传 $el 给 popover，因 ref 绑在组件上拿到的是组件实例不是 DOM）
const handleButtonClick = () => {
  if (popoverRef.value) {
    const triggerEl = buttonRef.value?.$el as HTMLElement | undefined
    popoverRef.value.show(triggerEl)
  }
}

// 处理筛选配置变化
const handleFilterChange = (rules: FilterRule[]) => {
  columnFilterRules.value = rules
  emits('filter-change', rules)
}
</script>

<style scoped lang="scss">
.filter-button-wrapper {
  display: inline-block;
}
</style>
