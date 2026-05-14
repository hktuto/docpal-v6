<script setup lang="ts">
import { ref, computed } from 'vue'
import { Sort } from '@element-plus/icons-vue'
import type { SortRule } from './configPopover.vue'
import type { ColumnConfig } from '../../types/column-context'

const { t } = useI18n()

interface Props {
  availableColumns: ColumnConfig[]
  disabled?: boolean
}
const gridRef = useMDTableInject()
const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'sort-change', rules: SortRule[]): void
}>()

const buttonRef = ref<InstanceType<typeof ElButton>>()
const popoverRef = ref<InstanceType<typeof ToolsSortConfigPopover>>()
const { columnSortRules: sortRules } = inject('viewTools')

const sortButtonLabel = computed(() => {
  const rules = sortRules.value || []
  const hasField = rules.length > 0 && rules.some((r) => r.field)
  if (hasField) {
    return t('mdTable.sort.buttonWithCount', { count: rules.length })
  }
  return t('mdTable.sort.button')
})

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.availableColumns) {
    props.availableColumns.filter((column) => sortRules.value.some((sort) => sort.field === column.field))
    return props.availableColumns
  }
  return []
})

// 处理按钮点击
const handleButtonClick = () => {
  if (popoverRef.value) {
    const el = buttonRef.value?.$el as HTMLElement | undefined
    popoverRef.value.show(el)
  }
}

// 处理排序配置变化
const handleSortChange = () => {
  console.log('handleSortChange', sortRules.value)
  emits('sort-change', sortRules.value)
}
</script>

<template>
  <div class="sort-button-wrapper" v-if="sortRules">
    <el-button ref="buttonRef" :disabled="disabled" type="primary" :aria-label="sortButtonLabel" @click="handleButtonClick">
      <el-icon class="sort-icon">
        <Sort />
      </el-icon>
      {{ sortButtonLabel }}
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

<style scoped lang="scss">
.sort-button-wrapper {
  display: inline-block;

  .sort-icon {
    margin-right: 4px;
  }
}
</style>
