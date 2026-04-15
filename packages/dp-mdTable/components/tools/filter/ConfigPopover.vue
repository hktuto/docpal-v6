<template>
  <UiPopoverDialog ref="popoverRef" :width="width" :placement="placement" title="Filter Settings" :close-on-click-outside="closeOnClickOutside">
    <div class="filter-config-popover">
      <!-- 标题和提示信息 -->
      <div class="popover-header">
        <div class="auto-save-tip">View configuration is auto-saved. Your changes are saved in real time and synced to other members.</div>
      </div>

      <!-- 筛选规则列表 -->
      <div class="filter-rules">
        <div v-for="(rule, index) in columnFilterRules.conditions" :key="rule.id" class="filter-rule-item">
          <!-- 第一列：逻辑连接符 -->
          <div class="logic-connector">
            <el-button v-if="index !== 1" disabled size="small" class="connector-btn">
              {{ index === 0 ? 'When' : columnFilterRules.conjunction === 'AND' ? 'And' : 'Or' }}
            </el-button>
            <el-select
              v-else
              v-model="columnFilterRules.conjunction"
              size="small"
              class="connector-select"
              :disabled="index > 1"
              @change="handleRuleChange"
              @visible-change="handleSelectVisibleChange"
              @click.stop
            >
              <el-option label="AND" value="AND" />
              <el-option label="OR" value="OR" />
            </el-select>
          </div>

          <!-- 第二列：字段选择 -->
          <el-select
            v-model="rule.field"
            placeholder="Select field"
            size="small"
            class="field-select"
            @change="handleFieldChange(rule)"
            @visible-change="handleSelectVisibleChange"
            @click.stop
          >
            <el-option v-for="col in availableColumns" :key="col.field" :label="col.title" :value="col.field">
              <div class="field-option">
                <el-icon class="field-icon" :size="16">
                  <component :is="getFieldIcon(col.type)" />
                </el-icon>
                <span>{{ col.title }}</span>
              </div>
            </el-option>
          </el-select>

          <!-- 第三列：操作符选择 -->
          <el-select
            v-model="rule.operator"
            placeholder="Select operator"
            size="small"
            class="operator-select"
            @change="handleEditRule(rule)"
            @visible-change="handleSelectVisibleChange"
            @click.stop
          >
            <el-option v-for="op in getOperatorsForField(rule.field)" :key="op.value" :label="op.label" :value="op.value" />
          </el-select>

          <!-- 第四列：值输入 -->
          <el-date-picker
            v-if="isDateField(rule.field)"
            v-model="rule.value"
            placeholder="Select date"
            size="small"
            class="value-input"
            value-format="x"
            @change="handleEditRule(rule)"
          />
          <el-input
            v-else-if="!isValueEmptyOperator(rule.operator)"
            v-model="rule.value"
            placeholder="Enter value"
            size="small"
            class="value-input"
            @input="handleEditRule(rule)"
          />

          <!-- 删除按钮 -->
          <el-button type="danger" :icon="Delete" size="small" text class="delete-btn" @click="handleDeleteRule(index)" />
        </div>
      </div>

      <!-- 添加新规则 -->
      <div class="add-rule-section">
        <el-button type="primary" :icon="Plus" size="small" text @click="handleAddRule"> Add filter condition </el-button>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Delete, Plus, Document, Clock } from '@element-plus/icons-vue'
import type { ColumnConfig } from '@packages/dp-mdTable/types/column-context'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'

export interface FilterRule {
  id: string
  connector: 'AND' | 'OR'
  field: string
  operator: string
  value: string | number
}

interface OperatorOption {
  label: string
  value: string
}

interface Props {
  availableColumns?: ColumnConfig[]
  width?: number | string
  placement?: string
}

const props = withDefaults(defineProps<Props>(), {
  availableColumns: () => [],
  width: 600,
  placement: 'bottom-start'
})

const emit = defineEmits<{
  'filter-change': [
    rules: {
      conditions: FilterRule[]
      conjunction: 'AND' | 'OR'
    }
  ]
}>()

const popoverRef = ref()
const { columnFilterRules } = useMDTableInject()
const closeOnClickOutside = ref(true)
const openSelectCount = ref(0)

// 处理下拉菜单显示/隐藏
const handleSelectVisibleChange = (visible: boolean) => {
  if (visible) {
    openSelectCount.value++
    closeOnClickOutside.value = false
  } else {
    openSelectCount.value--
    // 只有当所有下拉菜单都关闭时，才恢复 closeOnClickOutside
    if (openSelectCount.value <= 0) {
      openSelectCount.value = 0
      // 使用 nextTick 确保下拉菜单完全关闭后再恢复
      nextTick(() => {
        closeOnClickOutside.value = true
      })
    }
  }
}

// 检查字段是否为数字类型
const isNumericField = (field: string): boolean => {
  const column = props.availableColumns.find((col) => col.field === field)
  if (!column) return false
  console.log('isNumericField', column)
  const type = column.business_type
  return (
    type === ColumnFieldType.Number ||
    type === ColumnFieldType.Currency ||
    type === ColumnFieldType.Percent ||
    type === ColumnFieldType.AutoNumber ||
    type === ColumnFieldType.Rating
  )
}
const isDateField = (field: string): boolean => {
  const column = props.availableColumns.find((col) => col.field === field)
  if (!column) return false
  const type = column.business_type
  return type === ColumnFieldType.DateTime || type === ColumnFieldType.CreatedTime || type === ColumnFieldType.LastModifiedTime
}
// 获取字段的操作符选项
const getOperatorsForField = (field: string): OperatorOption[] => {
  console.log('getOperatorsForField', field)
  if (!field) {
    return []
  }
  if (isDateField(field)) {
    return [
      { label: 'Equals', value: 'EQ' },
      { label: 'After', value: 'GT' },
      { label: 'After or equals', value: 'GTE' },
      { label: 'Before', value: 'LT' },
      { label: 'Before or equals', value: 'LTE' },
      { label: 'Is empty', value: 'IS_NULL' },
      { label: 'Is not empty', value: 'IS_NOT_NULL' }
    ]
  } else if (isNumericField(field)) {
    // 数字类型操作符
    return [
      { label: '=', value: 'EQ' },
      { label: '≠', value: 'NE' },
      { label: '>', value: 'GT' },
      { label: '≥', value: 'GTE' },
      { label: '<', value: 'LT' },
      { label: '≤', value: 'LTE' },
      { label: 'Is empty', value: 'IS_NULL' }
    ]
  } else {
    // 非数字类型操作符
    console.log('getOperatorsForField', props.availableColumns)
    return [
      { label: 'Contains', value: 'LIKE' },
      // { label: 'Does not contain', value: 'NOT_LIKE' },
      { label: 'Equals', value: 'EQ' },
      { label: 'Not equals', value: 'NE' },
      { label: 'Is empty', value: 'IS_NULL' },
      { label: 'Is not empty', value: 'IS_NOT_NULL' },
      { label: 'Has duplicate', value: 'DUPLICATE' }
    ]
  }
}

// 检查操作符是否为"为空"类型（不需要输入值）
const isValueEmptyOperator = (operator: string): boolean => {
  return ['IS_NULL', 'IS_NOT_NULL', 'DUPLICATE'].includes(operator)
}

// 获取字段图标
const getFieldIcon = (type?: ColumnFieldType | string) => {
  if (type === ColumnFieldType.CreatedTime || type === ColumnFieldType.DateTime) {
    return Clock
  }
  return Document
}
function handleEditRule(rule: FilterRule) {
  console.log('handleEditRule', rule)
  if (rule.field && rule.operator) {
    if (isValueEmptyOperator(rule.operator)) {
      handleRuleChange()
    } else if (rule.value) {
      handleRuleChange()
    }
  }
}
// 处理规则变化
const handleRuleChange = () => {
  console.log('handleRuleChange', columnFilterRules.value)
  emit('filter-change', {
    conditions: [...(columnFilterRules.value?.conditions || [])],
    conjunction: columnFilterRules.value?.conjunction || 'AND'
  })
}

// 处理字段变化
const handleFieldChange = (rule: FilterRule) => {
  if (!rule.field) {
    return
  }

  // 当字段改变时，重置操作符和值
  const operators = getOperatorsForField(rule.field)
  if (operators.length > 0) {
    rule.operator = operators[0].value
  }
  rule.value = ''
  handleEditRule(rule)
}

// 处理删除规则
const handleDeleteRule = (index: number) => {
  columnFilterRules.value.conditions.splice(index, 1)
  handleRuleChange()
}

// 处理添加规则
const handleAddRule = () => {
  const newRule: FilterRule = {
    id: `filter-${Date.now()}-${Math.random()}`,
    connector: columnFilterRules.value?.conjunction || 'AND',
    field: '',
    operator: '',
    value: ''
  }

  columnFilterRules.value = {
    conjunction: columnFilterRules.value?.conjunction || 'AND',
    conditions: [...(columnFilterRules.value?.conditions || []), newRule]
  }
}

// 显示 popover
const show = (triggerEl?: HTMLElement | null) => {
  popoverRef.value?.open?.(triggerEl)
}

// 隐藏 popover
const hide = () => {
  popoverRef.value?.close?.()
}

// 暴露方法
defineExpose({
  show,
  hide
})
</script>

<style scoped lang="scss">
.filter-config-popover {
  padding: 16px;
  min-width: 500px;

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

  .filter-rules {
    .filter-rule-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 8px;
      transition: background-color 0.2s;

      &:hover {
        background: #ebedf0;
      }

      .logic-connector {
        width: 60px;
        flex-shrink: 0;

        .connector-btn {
          width: 100%;
          cursor: not-allowed;
        }

        .connector-select {
          width: 100%;
        }
      }

      .field-select {
        flex: 1;
        min-width: 150px;
      }

      .operator-select {
        flex: 1;
        min-width: 120px;
      }

      .value-input {
        flex: 1;
        min-width: 150px;
      }

      .delete-btn {
        flex-shrink: 0;
      }
    }
  }

  .add-rule-section {
    margin-top: 12px;
    display: flex;
    justify-content: center;
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
