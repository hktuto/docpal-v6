<template>
  <el-popover ref="popoverRef" :width="width" trigger="click" :placement="placement" :popper-class="popperClass" :virtual-ref="virtualRef" virtual-triggering>
    <template #default>
      <div class="grouping-config-popover">
        <!-- 标题和提示信息 -->
        <div class="popover-header">
          <div class="header-title">
            <span>{{ t('mdTable.grouping.popoverTitle') }}</span>
            <el-icon class="info-icon" :size="16">
              <QuestionFilled />
            </el-icon>
          </div>
          <div class="auto-save-tip">{{ t('mdTable.grouping.autoSaveTip') }}</div>
        </div>

        <!-- 分组规则列表 -->
        <div class="grouping-rules">
          <draggable v-model="groupingRules" item-key="id" handle=".drag-handle" :animation="200" ghost-class="ghost-item" @change="handleRulesChange">
            <template #item="{ element, index }">
              <div class="grouping-rule-item">
                <!-- 拖拽手柄 -->
                <div class="drag-handle" :aria-label="t('mdTable.columnConfig.dragToSort')">
                  <el-icon :size="16">
                    <Rank />
                  </el-icon>
                </div>

                <!-- 字段选择 -->
                <el-select
                  v-model="element.field"
                  :placeholder="t('mdTable.grouping.selectPlaceholder')"
                  class="field-select"
                  :teleported="false"
                  @change="handleFieldChange(element, index)"
                  @click.stop
                >
                  <el-option v-for="col in availableColumns" :key="col.field" :label="col.title" :value="col.field" :disabled="isFieldUsed(col.field, index)">
                    <div class="field-option">
                      <el-icon class="field-icon" :size="16">
                        <component :is="getFieldIcon(col.type)" />
                      </el-icon>
                      <span>{{ col.title }}</span>
                    </div>
                  </el-option>
                </el-select>

                <!-- 排序方向 -->
                <div class="sort-buttons">
                  <el-button :type="element.order === 'asc' ? 'primary' : ''" size="small" class="sort-btn" @click="handleSortChange(element, 'asc')">
                    {{ getSortLabel(element.field, 'asc') }}
                  </el-button>
                  <el-button :type="element.order === 'desc' ? 'primary' : ''" size="small" class="sort-btn" @click="handleSortChange(element, 'desc')">
                    {{ getSortLabel(element.field, 'desc') }}
                  </el-button>
                </div>

                <!-- 删除按钮 -->
                <el-button type="danger" :icon="Delete" size="small" text class="delete-btn" @click="handleDeleteRule(index)" />
              </div>
            </template>
          </draggable>
        </div>

        <!-- 添加新规则 -->
        <div class="add-rule-section" v-if="!isMaxGroupsReached">
          <el-select
            v-model="newRuleField"
            :placeholder="t('mdTable.grouping.selectPlaceholder')"
            class="add-field-select"
            :teleported="false"
            :disabled="isMaxGroupsReached"
            @change="handleAddRule"
            @click.stop
          >
            <el-option v-for="col in availableColumns" :key="col.field" :label="col.title" :value="col.field" :disabled="isFieldUsed(col.field)">
              <div class="field-option">
                <el-icon class="field-icon" :size="16">
                  <component :is="getFieldIcon(col.type)" />
                </el-icon>
                <span>{{ col.title }}</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="isMaxGroupsReached" class="max-groups-tip">{{ t('mdTable.grouping.maxGroupsTip', { count: groupMaxCount }) }}</div>
        </div>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Delete, Rank, QuestionFilled, Document, Clock } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import type { ColumnConfig } from '../../types/column-context'
import { ColumnFieldType } from '../../types/column-types'

export interface GroupingRule {
  id: string
  field: string
  order: 'asc' | 'desc'
}

interface Props {
  availableColumns?: ColumnConfig[]
  groupingRules?: GroupingRule[]
  virtualRef?: HTMLElement | (() => HTMLElement)
  width?: number | string
  placement?: string
  'popper-class'?: string
  groupMaxCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  availableColumns: () => [],
  groupingRules: () => [],
  width: 480,
  placement: 'bottom-start',
  'popper-class': '',
  groupMaxCount: 5
})

const emit = defineEmits<{
  'update:groupingRules': [rules: GroupingRule[]]
  change: [rules: GroupingRule[]]
}>()

const { t } = useI18n()

const popoverRef = ref()
const newRuleField = ref<string>('')
const groupingRules = ref<GroupingRule[]>([...props.groupingRules])

// 监听外部传入的规则变化
watch(
  () => props.groupingRules,
  (newRules) => {
    if (JSON.stringify(newRules) !== JSON.stringify(groupingRules.value)) {
      // 限制最多3个分组
      const limitedRules = newRules.slice(0, props.groupMaxCount)
      groupingRules.value = [...limitedRules]
      // 如果被截断了，需要通知父组件
      if (newRules.length > props.groupMaxCount) {
        handleRulesChange()
      }
    }
  },
  { deep: true }
)

// 检查是否达到最大分组数
const isMaxGroupsReached = computed(() => {
  return groupingRules.value.length >= props.groupMaxCount
})

// 检查字段是否已被使用
const isFieldUsed = (field: string, excludeIndex?: number): boolean => {
  return groupingRules.value.some((rule, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) {
      return false
    }
    return rule.field === field
  })
}

// 获取字段图标
const getFieldIcon = (type?: ColumnFieldType | string) => {
  if (type === ColumnFieldType.CreatedTime || type === ColumnFieldType.DateTime) {
    return Clock
  }
  return Document
}

// 获取排序标签
const getSortLabel = (field: string, order: 'asc' | 'desc'): string => {
  const column = props.availableColumns.find((col) => col.field === field)
  const isNumeric = column?.type === ColumnFieldType.Number || column?.type === ColumnFieldType.CreatedTime || column?.type === ColumnFieldType.DateTime

  if (isNumeric) {
    return order === 'asc' ? '1 → 9' : '9 → 1'
  }
  return order === 'asc' ? 'A → Z' : 'Z → A'
}

// 处理规则变化
const handleRulesChange = () => {
  emit('update:groupingRules', [...groupingRules.value])
  emit('change', [...groupingRules.value])
}

// 处理字段变化
const handleFieldChange = (rule: GroupingRule, index: number) => {
  if (!rule.field) {
    return
  }
  // 默认设置为升序
  if (!rule.order) {
    rule.order = 'asc'
  }
  handleRulesChange()
}

// 处理排序方向变化
const handleSortChange = (rule: GroupingRule, order: 'asc' | 'desc') => {
  rule.order = order
  handleRulesChange()
}

// 处理删除规则
const handleDeleteRule = (index: number) => {
  groupingRules.value.splice(index, 1)
  handleRulesChange()
}

// 处理添加规则
const handleAddRule = () => {
  if (!newRuleField.value) {
    return
  }

  // 检查是否达到最大分组数
  if (isMaxGroupsReached.value) {
    newRuleField.value = ''
    return
  }

  // 检查字段是否已存在
  if (isFieldUsed(newRuleField.value)) {
    newRuleField.value = ''
    return
  }

  const newRule: GroupingRule = {
    id: `rule-${Date.now()}-${Math.random()}`,
    field: newRuleField.value,
    order: 'asc'
  }

  groupingRules.value.push(newRule)
  newRuleField.value = ''
  handleRulesChange()
}

// 显示 popover
const show = () => {
  popoverRef.value?.show?.()
}

// 隐藏 popover
const hide = () => {
  popoverRef.value?.hide?.()
}

// 暴露方法
defineExpose({
  show,
  hide
})
</script>

<style scoped lang="scss">
.grouping-config-popover {
  padding: 16px;
  min-width: 400px;

  .popover-header {
    margin-bottom: 16px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 8px;

      .info-icon {
        color: #909399;
        cursor: help;
      }
    }

    .auto-save-tip {
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }
  }

  .grouping-rules {
    .grouping-rule-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 8px;
      transition: background-color 0.2s;

      &:hover {
        background: #ebedf0;
      }

      .drag-handle {
        cursor: move;
        color: #909399;
        display: flex;
        align-items: center;
        padding: 4px;

        &:hover {
          color: #606266;
        }
      }

      .field-select {
        flex: 1;
        min-width: 150px;
      }

      .sort-buttons {
        display: flex;
        gap: 4px;

        .sort-btn {
          min-width: 60px;
          padding: 4px 12px;
        }
      }

      .delete-btn {
        flex-shrink: 0;
      }
    }

    .ghost-item {
      opacity: 0.5;
      background: #e4e7ed;
    }
  }

  .add-rule-section {
    .add-field-select {
      width: 100%;
    }

    .max-groups-tip {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
      text-align: center;
    }
  }

  .field-option {
    display: flex;
    align-items: center;
    gap: 8px;

    .field-icon {
      color: #909399;
    }
  }
}
</style>
