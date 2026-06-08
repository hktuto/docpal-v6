<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FilterRules } from './ConfigPopover.vue'
import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

const { t } = useI18n()

interface Props {
  availableColumns: ColumnConfig[]
  columnFilterRules?: FilterRules
  disabled?: boolean
}
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'filter-change', rules: FilterRules): void
  (e: 'filter-change-search', rules: FilterRules): void
}>()

const isSearchMode = computed(() => props.columnFilterRules === undefined)

const popoverFilterRules = computed<FilterRules | []>(() =>
  isSearchMode.value ? [] : props.columnFilterRules!
)

const searchFilterRules = ref<FilterRules>({ conditions: [], conjunction: 'AND' })

const displayFilterRules = computed(() =>
  isSearchMode.value ? searchFilterRules.value : props.columnFilterRules
)

const canFilterColumns = computed(() => {
  if (!props.availableColumns) return []
  return props.availableColumns.filter(
    (col) => ![ColumnFieldType.Relation, ColumnFieldType.VirtualColumn, ColumnFieldType.Formula, ColumnFieldType.AggVirtualColumn].includes(col.business_type)
  )
})

const buttonRef = ref<InstanceType<typeof ElButton>>()
const popoverRef = ref<InstanceType<typeof FilterConfigPopover>>()

const filterButtonLabel = computed(() => {
  const n = displayFilterRules.value?.conditions?.length ?? 0
  if (n > 0) {
    return t('mdTable.filter.buttonWithCount', { count: n })
  }
  return t('mdTable.filter.button')
})

// 处理按钮点击（传 $el 给 popover，因 ref 绑在组件上拿到的是组件实例不是 DOM）
const handleButtonClick = () => {
  if (popoverRef.value) {
    const triggerEl = buttonRef.value?.$el as HTMLElement | undefined
    popoverRef.value.show(triggerEl)
  }
}

// 处理筛选配置变化
const handleFilterChange = (rules: FilterRules) => {
  if (isSearchMode.value) {
    searchFilterRules.value = rules
    emits('filter-change-search', rules)
  } else {
    emits('filter-change', rules)
  }
}
</script>

<template>
  <div class="filter-button-wrapper">
    <el-button
      ref="buttonRef"
      :disabled="disabled"
      type="primary"
      :aria-label="filterButtonLabel"
      @click="handleButtonClick"
    >
      {{ filterButtonLabel }}
    </el-button>
    <ToolsFilterConfigPopover
      ref="popoverRef"
      :available-columns="canFilterColumns"
      :column-filter-rules="popoverFilterRules"
      width="600"
      placement="bottom-start"
      @filter-change="handleFilterChange"
    />
  </div>
</template>

<style scoped lang="scss">
.filter-button-wrapper {
  display: inline-block;
}
</style>
