<template>
  <UiPopoverDialog ref="popoverRef" :width="width" :close-on-click-outside="closeOnClickOutside">
    <div class="add-column-popover">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="列标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入列标题" @keydown.enter.prevent="handleSubmit" />
        </el-form-item>
        <el-form-item label="数据类型" prop="type">
          <el-select-v2
            v-model="formData.type"
            placeholder="请选择数据类型"
            style="width: 100%"
            :options="columnFieldOptions"
            @visible-change="handleSelectVisibleChange"
            @change="handleSelectChange"
            @click.stop
          >
          </el-select-v2>
        </el-form-item>
        <component :is="AsyncComponent" v-if="AsyncComponent" :form-data="formData" />
        <el-form-item v-if="[ColumnFieldType.Text, ColumnFieldType.MultiText].includes(formData.type)" label="Default Value" prop="defaultValue">
          <el-input v-model="formData.defaultValue" />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">取消</el-button>
            <el-button type="primary" @click="handleSubmit">确定</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </UiPopoverDialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, provide } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { v7 as uuidv7 } from 'uuid'
import { defineAsyncComponent } from 'vue'
import { getColumnFieldOptions } from './columnBasic'
interface ColumnConfig {
  field: string
  title: string
  type?: ColumnFieldType
  visible?: boolean
  sortable?: boolean
  filterable?: boolean
  editRender?: any
  [key: string]: any
}

interface Props {
  virtualRef?: HTMLElement | (() => HTMLElement)
  width?: number | string
  placement?: string
  popperClass?: string
}
const columnFieldOptions = getColumnFieldOptions()
const props = withDefaults(defineProps<Props>(), {
  width: 320,
  placement: 'left-start',
  popperClass: ''
})
const { updateColumn } = useColumnsContext()

const emit = defineEmits<{
  submit: [column: ColumnConfig]
  cancel: []
}>()
const state = reactive({
  column: null,
  isEdit: false
})
const popoverRef = ref()
const triggerRef = ref()
const closeOnClickOutside = ref(true)
const openSelectCount = ref(0)
const formData = ref<ColumnConfig>({
  field: '',
  title: '',
  type: ColumnFieldType.MultiText
})
function show(targetParams: any, column: any) {
  console.log('show', targetParams, JSON.stringify(column))
  // check if targetParams is a html element, or is a vue component ref
  popoverRef.value.open(targetParams)
  state.column = null
  state.isEdit = false
  if (!!column) {
    // 优先从 column.properties 读取，如果没有则从 cellRender?.props 或 editRender?.props 读取
    const properties = column.properties || column.cellRender?.props || column.editRender?.props || {}
    state.column = column
    state.isEdit = true
    formData.value = {
      field: column.field,
      title: column.title,
      type: column.type,
      ...properties
    }
    console.log('formData', formData.value)
    loadComponent(column.type)
  }
}
const formRef = ref<FormInstance>()
let selectVisible = false
// 处理下拉菜单显示/隐藏
const handleSelectVisibleChange = (visible: boolean) => {
  // selectVisible = !selectVisible
  // if (selectVisible) {
  //   closeOnClickOutside.value = false
  // } else {
  //   closeOnClickOutside.value = true
  // }
}
const handleClose = () => {
  popoverRef.value.close()
  closeOnClickOutside.value = true
}
// 提供给子组件使用，让子组件的select也能控制popover的关闭行为
provide('handleSelectVisibleChange', handleSelectVisibleChange)
function handleSelectChange(value: any) {
  console.log('handleSelectChange', value)
  loadComponent(value)
}
const AsyncComponent = ref<null | any>(null)
// 定义加载组件的函数
const loadComponent = (value: any) => {
  const options = columnFieldOptions.reduce((acc: any, item: any) => {
    acc.push(...item.options)
    return acc
  }, [])
  const fieldSetting = options.find((item: any) => item.value === value)
  console.log('fieldSetting', fieldSetting)
  if (fieldSetting?.component) {
    AsyncComponent.value = defineAsyncComponent(() => import(`./field/${fieldSetting.component}.vue`))
  } else {
    AsyncComponent.value = null
  }
}
// 重置表单
const resetForm = () => {
  formData.value = {
    field: '',
    title: '',
    type: ColumnFieldType.MultiText
  }
  formRef.value?.clearValidate()
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()

    // 基本字段
    const basicFields = ['field', 'title', 'type']
    const columnConfig: ColumnConfig = {
      field: formData.value.field || createFieldId(),
      title: formData.value.title,
      type: formData.value.type
    }

    // 将其他字段保存到 properties 中
    const properties: Record<string, any> = {}
    Object.keys(formData.value).forEach((key) => {
      if (!basicFields.includes(key)) {
        properties[key] = formData.value[key]
      }
    })

    // 如果有 properties，则添加到 columnConfig 中
    if (Object.keys(properties).length > 0) {
      columnConfig.properties = properties
    }

    console.log('columnConfig', columnConfig)
    if (state.isEdit) {
      updateColumn(columnConfig.field, columnConfig as any)
    } else {
      emit('submit', columnConfig)
    }
    resetForm()
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  resetForm()
  handleClose()
  emit('cancel')
}

// 暴露方法
defineExpose({
  resetForm,
  show
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

:deep(.switch-container) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
