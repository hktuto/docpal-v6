<template>
  <div class="select-options-config">
    <div class="config-title">此列的值将转换为以下选项</div>
    <div class="options-list">
      <draggable v-model="options" item-key="id" handle=".drag-handle" :animation="200" ghost-class="ghost-item" @change="handleOptionsChange">
        <template #item="{ element, index }">
          <div class="option-item">
            <el-checkbox
              :model-value="isOptionSelected(element.id)"
              @change="(checked: boolean) => handleDefaultValueChange(element.id, checked)"
              @click.stop
            />
            <div class="drag-handle">
              <svg-icon src="/icons/drag.svg" />
            </div>
            <el-color-picker
              v-model="element.color"
              show-alpha
              size="small"
              ref="colorPickerRef"
              popper-class="selector-color-picker-popper"
              @change="updateFormData"
              @click.stop
            />
            <el-input v-model="element.label" ref="labelInputRef" placeholder="请输入选项名称" class="option-input" @input="handleOptionInput(index)" />
            <el-button type="danger" :icon="Delete" size="small" text class="delete-btn" @click="handleDeleteOption(index)" />
          </div>
        </template>
      </draggable>
    </div>
    <!-- 添加选项按钮 -->
    <div class="action-buttons">
      <el-button type="primary" :icon="Plus" size="small" text class="add-option-btn" @click="handleAddOption"> 添加一个选项 </el-button>
      <el-button
        type="warning"
        :icon="Close"
        size="small"
        text
        class="clear-default-btn"
        :disabled="!hasDefaultValue"
        @click="handleClearDefaultValue"
      >
        清除默认值
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject, nextTick, computed, onMounted } from 'vue'
import { Delete, Plus, Close } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { ElMessageBox } from 'element-plus'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
const props = defineProps<{
  formData: any
  column: any
}>()

const { getOptionsFromTableData } = useMDTableInject()
// 预设颜色列表
const PRESET_COLORS = [
  '#9b59b6', // 紫色
  '#3498db', // 蓝色
  '#1abc9c', // 青色
  '#2ecc71', // 绿色
  '#e74c3c', // 红色
  '#f39c12', // 橙色
  '#34495e', // 深灰色
  '#95a5a6' // 浅灰色
]

interface SelectOption {
  id: string
  label: string
  color: string
}

// 从父组件获取select visible change处理函数
const handleSelectVisibleChange = inject<(visible: boolean) => void>('handleSelectVisibleChange')

// 选项列表
const options = ref<SelectOption[]>([])

// 判断是否为多选类型
const isMultiSelect = computed(() => {
  return props.formData?.type === ColumnFieldType.MultiSelect
})

// 判断是否有默认值
const hasDefaultValue = computed(() => {
  if (!props.formData?.defaultValue) {
    return false
  }
  if (isMultiSelect.value) {
    // 多选：检查数组是否有值
    return Array.isArray(props.formData.defaultValue) && props.formData.defaultValue.length > 0
  } else {
    // 单选：检查是否有值
    return props.formData.defaultValue !== undefined && props.formData.defaultValue !== null && props.formData.defaultValue !== ''
  }
})

// 判断选项是否被选为默认值
const isOptionSelected = (optionId: string): boolean => {
  if (!props.formData?.defaultValue) {
    return false
  }
  if (isMultiSelect.value) {
    // 多选：defaultValue 应该是数组
    const defaultValue = Array.isArray(props.formData.defaultValue) ? props.formData.defaultValue : []
    return defaultValue.includes(optionId)
  } else {
    // 单选：defaultValue 应该是单个值
    return props.formData.defaultValue === optionId
  }
}

// 处理默认值变化
const handleDefaultValueChange = (optionId: string, checked: boolean) => {
  if (!props.formData) {
    return
  }

  if (isMultiSelect.value) {
    // 多选模式
    if (!Array.isArray(props.formData.defaultValue)) {
      props.formData.defaultValue = []
    }
    if (checked) {
      // 添加选项
      if (!props.formData.defaultValue.includes(optionId)) {
        props.formData.defaultValue.push(optionId)
      }
    } else {
      // 移除选项
      const index = props.formData.defaultValue.indexOf(optionId)
      if (index > -1) {
        props.formData.defaultValue.splice(index, 1)
      }
    }
  } else {
    // 单选模式
    if (checked) {
      // 选中当前选项，取消其他选项
      props.formData.defaultValue = optionId
    } else {
      // 取消选中
      props.formData.defaultValue = undefined
    }
  }
}

// 生成唯一ID
const generateId = (): string => {
  return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取下一个可用颜色
const getNextColor = (): string => {
  const usedColors = options.value.map((opt) => opt.color)
  for (const color of PRESET_COLORS) {
    if (!usedColors.includes(color)) {
      return color
    }
  }
  // 如果所有颜色都用完了，循环使用
  return PRESET_COLORS[options.value.length % PRESET_COLORS.length]
}



// 初始化选项
const initOptions = async() => {
  // check type in column if current column type is not select or multiSelect, need to try get all possible options from table data
  if (props.column.type !== ColumnFieldType.SingleSelect && props.column.type !== ColumnFieldType.MultiSelect) {
    // promt user to see if need to convert current table data into options
    const possibleOptions = await getOptionsFromTableData(props.column)

    if(possibleOptions.length > 0) {
      possibleOptions.forEach((opt: any) => {
        options.value.push({
          id: opt,
          label: opt || '',
          color: getNextColor()
        })
      })
      props.formData.options = options.value
      console.log('options', options.value)
      return
    }

  }
  // 如果父组件的 formData 中有选项数据，使用它
  if (props.formData?.options && Array.isArray(props.formData.options) && props.formData.options.length > 0) {
    options.value = props.formData.options.map((opt: any) => ({
      id: opt.id || generateId(),
      label: opt.label || '',
      color: opt.color || getNextColor()
    }))
  } else {
    // 如果没有选项，初始化为空数组
    options.value = []
    // 确保父组件的 formData 有 options 属性
    if (!props.formData.options) {
      props.formData.options = []
    }
  }

  // 初始化 defaultValue
  if (props.formData) {
    if (isMultiSelect.value) {
      // 多选模式：确保 defaultValue 是数组
      if (!Array.isArray(props.formData.defaultValue)) {
        props.formData.defaultValue = props.formData.defaultValue ? [props.formData.defaultValue] : []
      }
    } else {
      // 单选模式：确保 defaultValue 是单个值或 undefined
      if (Array.isArray(props.formData.defaultValue) && props.formData.defaultValue.length > 0) {
        props.formData.defaultValue = props.formData.defaultValue[0]
      }
    }
  }
}

// 添加选项
const handleAddOption = () => {
  const newOption: SelectOption = {
    id: generateId(),
    label: '',
    color: getNextColor()
  }
  options.value.push(newOption)
  updateFormData()
}

// 清除默认值
const handleClearDefaultValue = () => {
  if (!props.formData) {
    return
  }
  if (isMultiSelect.value) {
    props.formData.defaultValue = []
  } else {
    props.formData.defaultValue = undefined
  }
}

// 删除选项
const handleDeleteOption = (index: number) => {
  const deletedOption = options.value[index]
  options.value.splice(index, 1)

  // 如果删除的选项是默认值，需要从 defaultValue 中移除
  if (deletedOption && props.formData?.defaultValue) {
    if (isMultiSelect.value) {
      // 多选模式：从数组中移除
      if (Array.isArray(props.formData.defaultValue)) {
        const index = props.formData.defaultValue.indexOf(deletedOption.id)
        if (index > -1) {
          props.formData.defaultValue.splice(index, 1)
        }
      }
    } else {
      // 单选模式：如果删除的是默认值，清空 defaultValue
      if (props.formData.defaultValue === deletedOption.id) {
        props.formData.defaultValue = undefined
      }
    }
  }

  updateFormData()
}

// 选项输入变化
const handleOptionInput = (index: number) => {
  updateFormData()
}
// 选项拖拽变化
const handleOptionsChange = () => {
  updateFormData()
}

// 更新表单数据
const updateFormData = () => {
  if (props.formData && !isUpdatingFromProps) {
    const newOptions = options.value.map((opt) => ({
      id: opt.id,
      label: opt.label,
      color: opt.color
    }))

    // 只在内容真正变化时才更新，避免触发 watch
    const currentOptionsStr = JSON.stringify(
      (props.formData.options || []).map((opt: any) => ({ id: opt.id, label: opt.label, color: opt.color })).sort((a: any, b: any) => a.id.localeCompare(b.id))
    )
    const newOptionsStr = JSON.stringify(newOptions.map((opt) => ({ id: opt.id, label: opt.label, color: opt.color })).sort((a, b) => a.label.localeCompare(b.label)))

    if (currentOptionsStr !== newOptionsStr) {
      props.formData.options = newOptions
    }
  }
}

// 标志位，用于避免循环更新
let isUpdatingFromProps = false

// 同步选项数据到本地
const syncOptionsFromProps = () => {
  if (isUpdatingFromProps) {
    return
  }

  const newOptions = props.formData?.options
  if (newOptions && Array.isArray(newOptions)) {
    // 比较新选项和当前选项是否相同（通过比较序列化后的字符串）

    const normalizeOptions = (opts: any[]) => {
      return JSON.stringify(
        opts
          .map((opt: any) => ({ id: opt.id || '', label: opt.label || '', color: opt.color || '' }))
          .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''))
      )
    }

    const newOptionsStr = normalizeOptions(newOptions)
    const currentOptionsStr = normalizeOptions(options.value)

    if (newOptionsStr !== currentOptionsStr) {
      isUpdatingFromProps = true
      if (newOptions.length > 0) {
        options.value = newOptions.map((opt: any) => ({
          id: opt.id || generateId(),
          label: opt.label || '',
          color: opt.color || getNextColor()
        }))
      } else {
        options.value = []
      }
      nextTick(() => {
        isUpdatingFromProps = false
      })
    }
  } else if (!newOptions || newOptions.length === 0) {
    // 如果父组件清空了选项，也清空本地选项
    if (options.value.length > 0) {
      isUpdatingFromProps = true
      options.value = []
      nextTick(() => {
        isUpdatingFromProps = false
      })
    }
  }
}

// 监听父组件 formData 的变化（用于编辑模式）
watch(
  () => props.formData?.options,
  () => {
    syncOptionsFromProps()
  },
  { immediate: true, deep: true }
)

// 监听类型变化，重新初始化 defaultValue
watch(
  () => props.formData?.type,
  () => {
    if (props.formData) {
      if (isMultiSelect.value) {
        // 多选模式：确保 defaultValue 是数组
        if (!Array.isArray(props.formData.defaultValue)) {
          props.formData.defaultValue = props.formData.defaultValue ? [props.formData.defaultValue] : []
        }
      } else {
        // 单选模式：确保 defaultValue 是单个值或 undefined
        if (Array.isArray(props.formData.defaultValue) && props.formData.defaultValue.length > 0) {
          props.formData.defaultValue = props.formData.defaultValue[0]
        } else if (Array.isArray(props.formData.defaultValue)) {
          props.formData.defaultValue = undefined
        }
      }
    }
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  initOptions()
})
</script>

<style scoped lang="scss">
.select-options-config {
  .config-title {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  .options-list {
      max-height: 400px;
      overflow-y: auto;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: var(--app-space-xs);
    padding: var(--app-space-xs) 0;

    &:last-child {
      margin-bottom: 0;
    }

    .el-checkbox {
      margin-right: var(--app-space-xs);
    }

    .drag-handle {
      cursor: move;
      :deep(.svg-icon) {
        cursor: move;
      }
      display: flex;
      align-items: center;
    }
  }

  .ghost-item {
    opacity: 0.5;
  }

  .action-buttons {
    display: flex;
    gap: var(--app-space-xs);
    margin-top: var(--app-space-xs);

    .add-option-btn {
      flex: 1;
      justify-content: center;
    }

    .clear-default-btn {
      flex: 1;
      justify-content: center;
    }
  }
}
</style>
