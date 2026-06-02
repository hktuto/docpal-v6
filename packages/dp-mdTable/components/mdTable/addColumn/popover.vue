<template>
  <UiPopoverDialog ref="popoverRef" :width="width" :close-on-click-outside="closeOnClickOutside" @close="handlePopoverClose">
    <div class="add-column-popover">
      <el-form ref="formRef" :model="formData" :rules="rules" label-position="top" @submit.prevent>
        <el-form-item :label="t('mdTable.addColumnField.columnTitle')" prop="field_name">
          <el-input v-model="formData.field_name" :placeholder="t('mdTable.addColumnField.enterColumnTitle')" @keydown.enter.prevent="handleSubmit" />
        </el-form-item>
        <el-form-item :label="t('mdTable.addColumnField.dataType')" prop="business_type">
          <el-select-v2
            v-model="formData.business_type"
            :placeholder="t('mdTable.addColumnField.selectDataType')"
            style="width: 100%"
            :options="displayColumnFieldOptions"
            @visible-change="handleSelectVisibleChange"
            @change="handleTypeChange"
            @click.stop
          >
          </el-select-v2>
        </el-form-item>
        <component :is="AsyncComponent" v-if="AsyncComponent" :column="state.column" :form-data="formData" />
        <el-form-item
          v-if="[ColumnFieldType.Text, ColumnFieldType.MultiText].includes(formData.business_type)"
          :label="t('mdTable.addColumnField.defaultValue')"
          prop="defaultValue"
        >
          <el-input v-model="formData.defaultValue" />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleCancel">{{ t('mdTable.addColumnField.cancel') }}</el-button>
            <el-button type="primary" @click="handleSubmit">{{ t('mdTable.addColumnField.confirm') }}</el-button>
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
const { t } = useI18n()

interface Props {
  virtualRef?: HTMLElement | (() => HTMLElement)
  width?: number | string
  placement?: string
  popperClass?: string
}
const { deleteColumn, updateColumn, addColumn, tableFields } = useMDTableInject()
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
  refresh: []
  'config-edit-start': [column: any]
  'config-edit-finish': [payload: { column: any; changed: boolean }]
}>()
const state = reactive({
  column: null,
  isEdit: false
})
const popoverRef = ref()
const triggerRef = ref()
const closeOnClickOutside = ref(true)
const openSelectCount = ref(0)
const editingColumnConfig = ref(false)
const formData = ref<ColumnConfig>({
  field_name: t('mdTable.addColumnField.newField'),
  business_type: ColumnFieldType.MultiText
})
function show(targetParams: any, column: any) {
  console.log('show', targetParams, JSON.stringify(column))
  finishColumnConfigEdit(false)
  // check if targetParams is a html element, or is a vue component ref
  popoverRef.value.open(targetParams)
  state.column = null
  state.isEdit = false
  editingColumnConfig.value = false
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
    editingColumnConfig.value = true
    emit('config-edit-start', column)
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
function handlePopoverClose() {
  finishColumnConfigEdit(false)
  resetForm()
  state.column = null
  state.isEdit = false
  closeOnClickOutside.value = true
}
function finishColumnConfigEdit(changed: boolean) {
  if (!editingColumnConfig.value || !state.column) return
  emit('config-edit-finish', {
    column: state.column,
    changed
  })
  editingColumnConfig.value = false
}
// 提供给子组件使用，让子组件的select也能控制popover的关闭行为
provide('handleSelectVisibleChange', handleSelectVisibleChange)
function handleTypeChange(newValue: any) {
  const nextFormData: any = {
    field_name: formData.value.field_name,
    business_type: newValue
  }

  if (Object.prototype.hasOwnProperty.call(formData.value, 'options') && [ColumnFieldType.SingleSelect, ColumnFieldType.MultiSelect].includes(newValue)) {
    nextFormData.options = formData.value.options
  }

  formData.value = nextFormData
  loadComponent(newValue)
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
    field_name: t('mdTable.addColumnField.newField'),
    business_type: ColumnFieldType.MultiText
  }
  formRef.value?.clearValidate()
  loadComponent(formData.value.business_type)
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    const stateColumn = JSON.parse(JSON.stringify(state.column))
    await formRef.value.validate()
    // 基本字段
    const basicFields = ['field_name', 'business_type', 'relation_table_id', 'display_field_ids', 'is_array', 'aggregation_field_name', 'aggregation_method','formula_expression']
    const display_structure_fields = ['relation_table_id', 'display_field_ids', 'formula_expression']
    const columnConfig: ColumnConfig = {}
    // 将其他字段保存到 display_structure 中
    const display_structure: Record<string, any> = {}
    Object.keys(formData.value).forEach((key) => {
      if (!basicFields.includes(key)) {
        display_structure[key] = formData.value[key]
      } else {
        columnConfig[key] = formData.value[key]
      }
    })
    display_structure_fields.forEach((field) => {
      if (formData.value[field]) {
        display_structure[field] = formData.value[field]
      }
    })
    if (Object.keys(display_structure).length > 0) {
      columnConfig.display_structure = display_structure
    }

    let didEditColumn = false
    if (state.isEdit) {
      const oldType = (state.column as any)?.business_type
      const newType = formData.value.business_type
      // Type changed - warn user about potential data loss
      if (oldType !== newType) {
        try {
          await ElMessageBox.confirm(t('mdTable.addColumnField.typeChangeWarning'), t('mdTable.addColumnField.warning'), {
            type: 'warning',
            confirmButtonText: t('mdTable.addColumnField.continue'),
            cancelButtonText: t('mdTable.addColumnField.cancel')
          })
        } catch {
          // User cancelled
          return
        }
      }
      console.log('updateColumn', stateColumn.field_name, columnConfig)
      await updateColumn(stateColumn.field_name, columnConfig as any)
      didEditColumn = true
    } else {
      await addColumn([columnConfig])
    }
    if ([ColumnFieldType.AggVirtualColumn, ColumnFieldType.VirtualColumn].includes(columnConfig.business_type)) {
      await updateRelationDisplayFields(columnConfig)
    }
    if (didEditColumn) {
      finishColumnConfigEdit(true)
    }
    resetForm()
    handleClose()
    emit('refresh')
  } catch (error) {
    console.error(t('mdTable.addColumnField.formValidationFailed'), error)
  }
}
async function updateRelationDisplayFields(column: ColumnConfig) {
  const relationFields = tableFields.value.find((item: any) => item.display_structure?.relation_table_id === column.relation_table_id)
  if (relationFields && column.display_structure?.display_field_id) {
    const existColumn = relationFields.display_structure.display_field_ids.includes(column.display_structure?.display_field_id)
    if (!existColumn) {
      relationFields.display_structure.display_field_ids.push(column.display_structure?.display_field_id)
      await updateColumn(relationFields.field_name, {
        business_type: relationFields.business_type,
        display_field_ids: relationFields.display_structure.display_field_ids,
        relation_table_id: relationFields.display_structure.relation_table_id,
        display_structure: {
          ...relationFields.display_structure,
          display_field_ids: relationFields.display_structure.display_field_ids
        }
      })
    }
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
