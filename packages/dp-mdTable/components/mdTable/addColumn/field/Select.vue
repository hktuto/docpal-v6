<template>
  <div class="select-options-config">
    <div class="config-title">此列的值将转换为以下选项</div>
    <div class="options-list">
      <draggable v-model="options" item-key="id" handle=".drag-handle" :animation="200" ghost-class="ghost-item" @change="handleOptionsChange">
        <template #item="{ element, index }">
          <div class="option-item">
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
    <el-button type="primary" :icon="Plus" size="small" text class="add-option-btn" @click="handleAddOption"> 添加一个选项 </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject, nextTick } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
const props = defineProps<{
  formData: any
}>()
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
const initOptions = () => {
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

// 删除选项
const handleDeleteOption = (index: number) => {
  options.value.splice(index, 1)
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
</script>

<style scoped lang="scss">
.select-options-config {
  .config-title {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 12px;
  }

  .options-list {
    margin-bottom: 12px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .drag-handle {
      cursor: move;
      display: flex;
      align-items: center;
      padding: 4px;
      margin-right: 4px;
    }
  }

  .ghost-item {
    opacity: 0.5;
  }

  .add-option-btn {
    width: 100%;
    justify-content: center;
    margin-top: 8px;
  }
}
</style>
