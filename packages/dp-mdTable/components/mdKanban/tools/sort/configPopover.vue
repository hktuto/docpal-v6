<template>
  <UiPopoverDialog ref="popoverRef" :width="width" :placement="placement" title="设置排序" :close-on-click-outside="closeOnClickOutside">
    <div class="sort-config-popover">
      <!-- 标题和提示信息 -->
      <div class="popover-header">
        <div class="auto-save-tip">视图配置处于自动保存中，你的操作会实时保存并同步给其他成员</div>
      </div>
      <!-- 排序规则列表 -->
      <div class="sort-rules">
        <draggable v-model="columnSortRules" item-key="id" handle=".drag-handle" :animation="200" ghost-class="ghost-item" @change="handleRuleOrderChange">
          <template #item="{ element, index }">
            <div class="sort-rule-item">
              <!-- 拖拽手柄 -->
              <!-- <div class="drag-handle">
                <el-icon :size="16">
                  <Rank />
                </el-icon>
              </div> -->

              <!-- 字段选择 -->
              <el-select
                v-model="element.field"
                placeholder="请选择一个选项"
                size="small"
                class="field-select"
                clearable
                @change="handleFieldChange(element)"
                @visible-change="handleSelectVisibleChange"
                @click.stop
              >
                <el-option v-for="col in availableColumns" :key="col.field" :label="col.title" :value="col.field">
                  <div class="field-option">
                    <span>{{ col.title }}</span>
                  </div>
                </el-option>
              </el-select>

              <!-- 排序方向按钮 -->
              <div class="sort-order-buttons">
                <el-button :type="element.order === 'asc' ? 'primary' : ''" size="small" class="order-btn" @click="handleOrderChange(element, 'asc')">
                  A → Z
                </el-button>
                <el-button :type="element.order === 'desc' ? 'primary' : ''" size="small" class="order-btn" @click="handleOrderChange(element, 'desc')">
                  Z → A
                </el-button>
              </div>

              <!-- 删除按钮 -->
              <el-button type="danger" :icon="Delete" size="small" text class="delete-btn" @click="handleDeleteRule(index)" />
            </div>
          </template>
        </draggable>
      </div>

      <!-- 添加新规则 -->
      <div class="add-rule-section">
        <el-button v-if="columnSortRules.length === 0" type="primary" :icon="Plus" size="small" text @click="handleAddRule"> 添加排序条件 </el-button>
      </div>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { ref, nextTick, type Ref } from 'vue'
import { Delete, Plus, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import type { ColumnConfig } from '../../types/column-context'
import { useMDKanbanInject } from '../../../../composables/mdKanban/useMDKanban'

export interface SortRule {
  id: string
  field: string
  order: 'asc' | 'desc'
}

interface Props {
  availableColumns?: ColumnConfig[]
  width?: number | string
  placement?: string
}

const { availableColumns = [], width = 600, placement = 'bottom-start' } = defineProps<Props>()

const emit = defineEmits<{
  change: [rules: SortRule[]]
}>()

const popoverRef = ref()
const { columnSortRules } = useMDKanbanInject() as { columnSortRules: Ref<SortRule[]> }
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

// 处理规则变化
const handleRuleChange = () => {
  emit('change')
}

// 处理字段变化
const handleFieldChange = (rule: SortRule) => {
  if (!rule.field) {
    return
  }
  // 如果还没有设置排序方向，默认设置为升序
  if (!rule.order) {
    rule.order = 'asc'
  }
  handleRuleChange()
}

// 处理排序方向变化
const handleOrderChange = (rule: SortRule, order: 'asc' | 'desc') => {
  rule.order = order
  handleRuleChange()
}

// 处理拖拽变化
const handleRuleOrderChange = () => {
  console.log('handleRuleOrderChange', columnSortRules.value)
  handleRuleChange()
}

// 处理删除规则
const handleDeleteRule = (index: number) => {
  columnSortRules.value.splice(index, 1)
  handleRuleChange()
}

// 处理添加规则
const handleAddRule = () => {
  const newRule: SortRule = {
    id: `sort-${Date.now()}-${Math.random()}`,
    field: '',
    order: 'asc'
  }
  columnSortRules.value.push(newRule)
  console.log('handleAddRule', columnSortRules.value)
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
.sort-config-popover {
  padding: 16px;
  min-width: 500px;

  .popover-header {
    margin-bottom: 16px;

    .auto-save-tip {
      font-size: 12px;
      color: #909399;
      line-height: 1.5;
    }
  }

  .sort-rules {
    .sort-rule-item {
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

      .drag-handle {
        display: flex;
        align-items: center;
        cursor: move;
        color: #909399;
        flex-shrink: 0;

        &:hover {
          color: #606266;
        }
      }

      .field-select {
        flex: 1;
        min-width: 150px;
      }

      .sort-order-buttons {
        display: flex;
        gap: 4px;
        flex-shrink: 0;

        .order-btn {
          min-width: 60px;
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
    margin-top: 12px;
    display: flex;
    justify-content: center;
  }

  .field-option {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
