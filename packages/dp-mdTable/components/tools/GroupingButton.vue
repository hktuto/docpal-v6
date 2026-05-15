<script setup lang="ts">
import { ref, computed } from 'vue'
import GroupingConfigPopover from './GroupingConfigPopover.vue'
import type { GroupingRule } from './GroupingConfigPopover.vue'
import type { ColumnConfig } from '../../types/column-context'

const { t } = useI18n()

interface Props {
  groupableColumns: ColumnConfig[]
  disabled?: boolean
  groupMaxCount?: number
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'grouping-change', rules: GroupingRule[]): void
}>()
const buttonRef = ref<HTMLElement>()
const popoverRef = ref<InstanceType<typeof GroupingConfigPopover>>()
const { columnGroupRules: groupingRules } = inject('viewTools')

const groupingButtonLabel = computed(() => {
  const n = groupingRules.value?.length ?? 0
  if (n > 0) {
    return t('mdTable.grouping.buttonWithCount', { count: n })
  }
  return t('mdTable.grouping.button')
})

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  if (props.groupableColumns) {
    return props.groupableColumns
  }
  return []
})

// 处理按钮点击
const handleButtonClick = () => {
  if (popoverRef.value) {
    popoverRef.value.show()
  }
}

// 处理分组配置变化，自动更新表格视图
const handleGroupingChange = (rules: GroupingRule[]) => {
  console.log('handleGroupingChange', rules)
  groupingRules.value = rules
  emits('grouping-change', rules)
}

// 暴露方法
defineExpose({
  groupingRules,
  show: () => popoverRef.value?.show(),
  hide: () => popoverRef.value?.hide()
})
</script>

<template>
  <div class="grouping-button-wrapper" v-if="groupingRules">
    <el-button
      ref="buttonRef"
      type="primary"
      :disabled="disabled"
      :aria-label="groupingButtonLabel"
      @click="handleButtonClick"
    >
      {{ groupingButtonLabel }}
    </el-button>
    <GroupingConfigPopover
      ref="popoverRef"
      :available-columns="availableColumns"
      v-model:grouping-rules="groupingRules"
      :virtual-ref="buttonRef"
      :groupMaxCount="groupMaxCount"
      width="480"
      placement="bottom-start"
      @change="handleGroupingChange"
    />
  </div>
</template>

<style scoped lang="scss">
.grouping-button-wrapper {
  display: inline-block;
}
</style>
