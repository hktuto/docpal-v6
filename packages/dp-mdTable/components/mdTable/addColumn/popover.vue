<template>
  <UiPopoverDialog ref="popoverRef" :width="width" :close-on-click-outside="closeOnClickOutside" @close="resetForm">
    <div class="add-column-popover">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item label="列标题" prop="field_name">
          <el-input v-model="formData.field_name" placeholder="请输入列标题" @keydown.enter.prevent="handleSubmit" />
        </el-form-item>
        <el-form-item label="数据类型" prop="business_type">
          <el-select-v2
            v-model="formData.business_type"
            placeholder="请选择数据类型"
            style="width: 100%"
            :options="displayColumnFieldOptions"
            @visible-change="handleSelectVisibleChange"
            @change="handleSelectChange"
            @click.stop
          >
          </el-select-v2>
        </el-form-item>
        <component :is="AsyncComponent" v-if="AsyncComponent" :column="state.column" :form-data="formData" />
        <el-form-item v-if="[ColumnFieldType.Text, ColumnFieldType.MultiText].includes(formData.business_type)" label="Default Value" prop="defaultValue">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { v7 as uuidv7 } from 'uuid'
import { defineAsyncComponent } from 'vue'
import { getColumnFieldOptions } from './columnBasic'
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import type { ColumnConfig } from '@packages/dp-mdTable/types/column-types'
// MagicLink (Relation) type constant
const RELATION_TYPE = 14

interface Props {
  virtualRef?: HTMLElement | (() => HTMLElement)
  width?: number | string
  placement?: string
  popperClass?: string
}
const { deleteColumn, updateColumn, addColumn } = useMDTableInject()
const columnFieldOptions = getColumnFieldOptions()
const displayColumnFieldOptions = computed(() => {
  return state.isEdit ? columnFieldOptions : columnFieldOptions.filter((item: any) => !item.disableCreate)
})
const props = withDefaults(defineProps<Props>(), {
  width: 320,
  placement: 'left-start',
  popperClass: ''
})

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
  field_name: '',
  business_type: ColumnFieldType.MultiText
})
function show(targetParams: any, column: any) {
  console.log('show', targetParams, JSON.stringify(column))
  // check if targetParams is a html element, or is a vue component ref
  popoverRef.value.open(targetParams)
  state.column = null
  state.isEdit = false
  if (!!column) {
    // 优先从 column.display_structure 读取，如果没有则从 cellRender?.props 或 editRender?.props 读取
    const display_structure = column.properties || column.cellRender?.props || column.editRender?.props || {}
    state.column = column
    state.isEdit = true
    formData.value = {
      field_name: column.title,
      business_type: column.business_type,
      ...display_structure
    }
    console.log('formData', formData.value)
    loadComponent(column.business_type)
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
  // reset the form data
  resetForm()
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
  if (fieldSetting?.component) {
    AsyncComponent.value = defineAsyncComponent(() => import(`./field/${fieldSetting.component}.vue`))
  } else {
    AsyncComponent.value = null
  }
}
// 重置表单
const resetForm = () => {
  formData.value = {
    field_name: '',
    business_type: ColumnFieldType.MultiText
  }
  formRef.value?.clearValidate()
  loadComponent(formData.value.business_type)
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    // 基本字段
    const basicFields = ['field_name', 'business_type']
    const columnConfig: ColumnConfig = {
      business_type: formData.value.business_type as ColumnFieldType
    }

    // 将其他字段保存到 display_structure 中
    const display_structure: Record<string, any> = {}
    Object.keys(formData.value).forEach((key) => {
      if (!basicFields.includes(key)) {
        display_structure[key] = formData.value[key]
      }
    })

    // 如果有 properties，则添加到 columnConfig 中
    if (Object.keys(display_structure).length > 0) {
      columnConfig.display_structure = display_structure
    }

    if (state.isEdit) {
      const oldType = (state.column as any)?.business_type
      const newType = formData.value.business_type
      columnConfig.field_name = formData.value.field_name
      // Type changed - warn user about potential data loss
      if (oldType !== newType) {
        try {
          await ElMessageBox.confirm('Changing column type may cause data loss. Do you want to continue?', 'Warning', {
            type: 'warning',
            confirmButtonText: 'Continue',
            cancelButtonText: 'Cancel'
          })
        } catch {
          // User cancelled
          return
        }
      }
      console.log('state.column', state.column)
      // Let useTableView handle type changes properly (including relation columns)
      // This preserves relation data when only changing display field
      updateColumn(state.column?.field, columnConfig as any)
    } else {
      columnConfig.field_name = formData.value.field_name
      addColumn([columnConfig])
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
