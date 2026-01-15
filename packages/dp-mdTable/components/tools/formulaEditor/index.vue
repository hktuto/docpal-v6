<template>
  <div class="formula-editor">
    <!-- 顶部输入框 -->
    <div class="formula-input-section">
      <div class="input-label">{{ t('mdTable.formulaEditor.inputLabel') }}</div>
      <el-input
        ref="formulaInputRef"
        v-model="formulaText"
        type="textarea"
        :rows="3"
        :placeholder="t('mdTable.formulaEditor.inputPlaceholder')"
        class="formula-input"
        @input="handleFormulaInput"
      />
      <div v-if="formulaValidateResult?.message" class="formula-error-tip">
        {{ formulaValidateResult.message }}
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="formula-content">
      <!-- 左侧选择列表 -->
      <div class="formula-sidebar">
        <div class="sidebar-title">{{ t('mdTable.formulaEditor.sidebarTitle') }}</div>

        <div v-for="category in categoryList" :key="category.type" class="category-section">
          <div class="category-title">{{ category.title }}</div>
          <div class="item-list">
            <div
              v-for="item in category.items"
              :key="category.type === 'variable' ? item.value : item.name"
              :class="['item', { active: isItemActive(category.type, item) }]"
              @click="selectItem(category.type, item)"
            >
              <span class="item-label">{{ category.type === 'variable' ? item.label : item.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧详情区域 -->
      <div class="formula-detail">
        <div v-if="selectedItem" class="detail-content">
          <!-- 标题 -->
          <div class="detail-title">{{ selectedItem.name || selectedItem.label }}</div>

          <!-- 描述 -->
          <div class="detail-section">
            <div class="section-label">{{ t('mdTable.formulaEditor.description') }}</div>
            <div class="section-content">{{ selectedItem.description }}</div>
          </div>

          <!-- 用法 -->
          <div class="detail-section">
            <div class="section-label">{{ t('mdTable.formulaEditor.usage') }}</div>
            <div class="section-content">
              <code class="usage-code">{{ selectedItem.usage }}</code>
            </div>
          </div>

          <!-- 参数说明 -->
          <div v-if="selectedItem.params && selectedItem.params.length > 0" class="detail-section">
            <div class="section-label">{{ t('mdTable.formulaEditor.params') }}</div>
            <div class="section-content">
              <div v-for="(param, index) in selectedItem.params" :key="index" class="param-item">
                <code class="param-name">{{ param.name }}</code>
                <span class="param-desc">：{{ param.description }}</span>
              </div>
            </div>
          </div>

          <!-- 例子 -->
          <div v-if="selectedItem.example" class="detail-section">
            <div class="section-label">{{ t('mdTable.formulaEditor.example') }}</div>
            <div class="section-content">
              <code class="example-code">{{ selectedItem.example }}</code>
            </div>
          </div>
        </div>
        <div v-else class="detail-empty">
          <div class="empty-text">{{ t('mdTable.formulaEditor.emptyText') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { textFunctions, numberFunctions, dateFunctions, logicalFunctions } from './formulaHelper'
import { validateFormula, type ValidateResult } from './formulaValid'

const { t } = useI18n()
interface Variable {
  label: string
  value: string
}

interface SelectedItem {
  type: 'variable' | 'text' | 'number' | 'date' | 'logical'
  name?: string
  label?: string
  value?: string
  description?: string
  usage?: string
  params?: Array<{
    name: string
    description: string
  }>
  example?: string
}

interface Category {
  type: 'variable' | 'text' | 'number' | 'date' | 'logical'
  title: string
  items: Array<Variable | any>
}

interface Props {
  modelValue: string
  variables?: Variable[]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  variables: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const formulaText = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const formulaValidateResult = ref<ValidateResult | null>(null)
const formulaInputRef = ref()
const selectedItem = ref<SelectedItem | null>(null)

// 获取变量列表
const variables = computed(() => props.variables || [])

// 分类列表
const categoryList = computed<Category[]>(() => [
  {
    type: 'variable',
    title: 'Variables',
    items: variables.value
  },
  {
    type: 'text',
    title: 'Text Functions',
    items: textFunctions
  },
  {
    type: 'number',
    title: 'Number Functions',
    items: numberFunctions
  },
  {
    type: 'date',
    title: 'Date Functions',
    items: dateFunctions
  },
  {
    type: 'logical',
    title: 'Logical Functions',
    items: logicalFunctions
  }
])

// 判断项目是否激活
function isItemActive(type: string, item: any): boolean {
  if (type === 'variable') {
    return selectedItem.value?.type === 'variable' && selectedItem.value?.value === item.value
  } else {
    return selectedItem.value?.type === type && selectedItem.value?.name === item.name
  }
}

// 处理公式输入变化
function handleFormulaInput() {
  nextTick(() => {
    formulaValidateResult.value = validateFormula(formulaText.value, variables.value)
  })
}

// 选择项
function selectItem(type: 'variable' | 'text' | 'number' | 'date' | 'logical', item: any) {
  if (type === 'variable') {
    selectedItem.value = {
      type: 'variable',
      label: item.label,
      value: item.value,

      description: `Variable: ${item.label}`,
      usage: `{${item.value}}`
    }
    // 插入变量到公式，光标在 } 右侧
    const variableText = `{${item.value}}`
    insertToFormula(variableText, variableText.length)
  } else {
    selectedItem.value = {
      type,
      name: item.name,
      description: item.description,
      usage: item.usage,
      params: item.params,
      example: item.example
    }
    // 插入函数到公式，需要插入函数名 + ( + )，光标在 ( 和 ) 之间
    const functionName = item.usage.split('(')[0]
    const functionText = `${functionName}()`
    // 光标应该在 ( 后面，也就是 functionName.length + 1 的位置
    insertToFormula(functionText, functionName.length + 1)
  }
}

// 插入到公式
// @param text - 要插入的文本
// @param cursorOffset - 光标偏移量，相对于插入文本开始位置的偏移（默认在文本末尾）
function insertToFormula(text: string, cursorOffset?: number) {
  const inputComponent = formulaInputRef.value
  if (inputComponent) {
    const textarea = inputComponent.$el?.querySelector('textarea') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const currentText = formulaText.value || ''
      const newText = currentText.substring(0, start) + text + currentText.substring(end)
      formulaText.value = newText
      // 设置光标位置
      // 如果没有指定 cursorOffset，默认在文本末尾
      const finalCursorPosition = start + (cursorOffset !== undefined ? cursorOffset : text.length)
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(finalCursorPosition, finalCursorPosition)
        handleFormulaInput()
      })
      return
    }
  }
  // 如果无法获取 textarea，直接追加到末尾
  formulaText.value = (formulaText.value || '') + text
  handleFormulaInput()
}
function checkFormulaValid() {
  return formulaValidateResult.value?.valid
}
defineExpose({ checkFormulaValid })
</script>

<style scoped lang="scss">
.formula-editor {
  .formula-input-section {
    margin-bottom: 20px;

    .input-label {
      font-size: 14px;
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    .formula-input {
      :deep(.el-textarea__inner) {
        font-family: 'Courier New', monospace;
        font-size: 14px;
      }
    }
  }

  .formula-content {
    display: flex;
    gap: 20px;
    min-height: 400px;
    max-height: 500px;

    .formula-sidebar {
      width: 250px;
      border-right: 1px solid var(--el-border-color);
      padding-right: 16px;
      overflow-y: auto;

      .sidebar-title {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
        margin-bottom: 16px;
      }

      .category-section {
        margin-bottom: 20px;

        .category-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--el-text-color-regular);
          margin-bottom: 8px;
        }

        .item-list {
          .item {
            padding: 8px 12px;
            margin-bottom: 4px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
            font-size: 13px;

            &:hover {
              background-color: var(--el-fill-color-light);
            }

            &.active {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }

            .item-label {
              display: block;
            }
          }
        }
      }
    }

    .formula-detail {
      flex: 1;
      overflow-y: auto;
      padding-left: 16px;

      .detail-content {
        .detail-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 20px;
        }

        .detail-section {
          margin-bottom: 24px;

          .section-label {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-regular);
            margin-bottom: 8px;
          }

          .section-content {
            font-size: 14px;
            color: var(--el-text-color-primary);
            line-height: 1.6;

            .usage-code,
            .example-code {
              display: block;
              padding: 12px;
              background-color: var(--el-fill-color-lighter);
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 13px;
              margin-top: 8px;
              white-space: pre-wrap;
              word-break: break-all;
            }

            .param-item {
              margin-bottom: 8px;

              .param-name {
                font-family: 'Courier New', monospace;
                font-size: 13px;
                color: var(--el-color-primary);
                background-color: var(--el-fill-color-lighter);
                padding: 2px 6px;
                border-radius: 3px;
              }

              .param-desc {
                margin-left: 4px;
              }
            }
          }
        }
      }

      .detail-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;

        .empty-text {
          font-size: 14px;
          color: var(--el-text-color-placeholder);
        }
      }
    }
  }
}
.formula-error-tip {
  color: var(--el-color-danger);
  font-size: 12px;
  margin-top: 4px;
}
</style>
