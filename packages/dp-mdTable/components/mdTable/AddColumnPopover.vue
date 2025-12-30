<template>
  <el-popover
    ref="popoverRef"
    :width="width"
    trigger="click"
    :placement="placement"
    :popper-class="popperClass"
    :virtual-ref="virtualRef"
    virtual-triggering
  >
    <template #default>
      <div class="add-column-popover">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
          @submit.prevent
        >
          <el-form-item label="字段名" prop="field">
            <el-input
              v-model="formData.field"
              placeholder="请输入字段名（英文）"
              @keydown.enter.prevent="handleSubmit"
            />
          </el-form-item>

          <el-form-item label="列标题" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="请输入列标题"
              @keydown.enter.prevent="handleSubmit"
            />
          </el-form-item>

          <el-form-item label="数据类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择数据类型"
              style="width: 100%"
              :teleported="false"
              @change="handleSelectChange"
              @click.stop
            >
              <el-option label="字符串" value="string" />
              <el-option label="数字" value="number" />
              <el-option label="整数" value="integer" />
            </el-select>
          </el-form-item>

          <el-form-item label="列宽度" prop="width">
            <el-input-number
              v-model="formData.width"
              :min="80"
              :max="800"
              placeholder="列宽度"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="最小宽度" prop="minWidth">
            <el-input-number
              v-model="formData.minWidth"
              :min="80"
              :max="800"
              placeholder="最小宽度"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-actions">
              <el-button @click="handleCancel">取消</el-button>
              <el-button type="primary" @click="handleSubmit">确定</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface ColumnConfig {
  field: string
  title: string
  type?: 'string' | 'number' | 'integer'
  width?: number
  minWidth?: number
  visible?: boolean
  sortable?: boolean
  filterable?: boolean
  editRender?: any
  [key: string]: any
}

interface Props {
  existingFields?: string[]
  virtualRef?: HTMLElement | (() => HTMLElement)
  width?: number | string
  placement?: string
  popperClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  existingFields: () => [],
  width: 320,
  placement: 'left-start',
  popperClass: ''
})

const emit = defineEmits<{
  submit: [column: ColumnConfig]
  cancel: []
}>()

const popoverRef = ref()
const formRef = ref<FormInstance>()
const formData = reactive<ColumnConfig>({
  field: '',
  title: '',
  type: 'string',
  width: 150,
  minWidth: undefined
})

// 验证规则
const validateField = (rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请输入字段名'))
    return
  }
  
  // 检查字段名格式（只允许英文、数字、下划线）
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    callback(new Error('字段名只能包含字母、数字和下划线，且不能以数字开头'))
    return
  }
  
  // 检查字段名是否已存在
  if (props.existingFields.includes(value)) {
    callback(new Error('该字段名已存在'))
    return
  }
  
  callback()
}

const rules: FormRules = {
  field: [{ validator: validateField, trigger: 'blur' }],
  title: [{ required: true, message: '请输入列标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

// 监听 existingFields 变化，更新验证
watch(() => props.existingFields, () => {
  if (formRef.value) {
    formRef.value.validateField('field', () => {})
  }
}, { deep: true })

// 重置表单
const resetForm = () => {
  formData.field = ''
  formData.title = ''
  formData.type = 'string'
  formData.width = 150
  formData.minWidth = undefined
  formRef.value?.clearValidate()
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    const columnConfig: ColumnConfig = {
      field: formData.field,
      title: formData.title,
      type: formData.type,
      width: formData.width,
      visible: true
    }
    
    if (formData.minWidth) {
      columnConfig.minWidth = formData.minWidth
    }
    
    // 根据类型设置编辑配置
    if (columnConfig.type === 'number' || columnConfig.type === 'integer') {
      columnConfig.editRender = { name: 'VxeInput', props: { type: 'number' } }
    } else {
      columnConfig.editRender = { name: 'VxeInput' }
    }
    
    emit('submit', columnConfig)
    resetForm()
    hide()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  resetForm()
  emit('cancel')
  hide()
}

// 显示 popover
const show = () => {
  popoverRef.value?.show?.()
}

// 隐藏 popover
const hide = () => {
  popoverRef.value?.hide?.()
}

// 处理下拉选择框的选择事件，确保选择后 popover 不会关闭
const handleSelectChange = async () => {
  // 选择后确保 popover 保持显示
  await nextTick()
  if (popoverRef.value) {
    popoverRef.value.show?.()
  }
}

// 暴露方法
defineExpose({
  resetForm,
  show,
  hide
})
</script>

<style scoped lang="scss">
.add-column-popover {
  padding: 12px;
  min-width: 300px;

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
    margin-top: 8px;
  }
}
</style>

