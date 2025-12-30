<template>
  <div class="grouping-button-wrapper">
    <el-button
      ref="buttonRef"
      type="primary"
      @click="handleButtonClick"
    >
      {{ groupingRules.length > 0 ? `${groupingRules.length}个分组` : '分组' }}
    </el-button>
    <GroupingConfigPopover
      ref="popoverRef"
      :available-columns="availableColumns"
      v-model:grouping-rules="groupingRules"
      :virtual-ref="buttonRef"
      width="480"
      placement="bottom-start"
      @change="handleGroupingChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import GroupingConfigPopover from './GroupingConfigPopover.vue'
import type { GroupingRule } from './GroupingConfigPopover.vue'
import type { ColumnConfig } from '../../composables/useColumns'


interface Props {
  groupableColumns: ColumnConfig[]
}

const props = defineProps<Props>()
const emits = defineEmits<{
  (e: 'grouping-change', rules: GroupingRule[]): void
}>()
const buttonRef = ref<HTMLElement>()
const popoverRef = ref<InstanceType<typeof GroupingConfigPopover>>()
const groupingRules = ref<GroupingRule[]>([])

// 获取可用列（自动响应 tableRef 变化）
const availableColumns = computed<ColumnConfig[]>(() => {
  console.log('availableColumns', props.groupableColumns)
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

<style scoped lang="scss">
.grouping-button-wrapper {
  display: inline-block;
}
</style>

