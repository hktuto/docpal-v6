<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { VariableType } from '../../../../../types/variable'
import { type DocTemplateVariable, DocTemplateProveKey } from '../../../../../utils/docTemplateHelper'
import VariableValueText from './VariableValueText.vue'
import VariableValueList from './VariableValueList.vue'
import VariableValueTable from './VariableValueTable.vue'
import VariableValueLink from './VariableValueLink.vue'
import VariableValueImage from './VariableValueImage.vue'
import VariableSignatureForm from './signature/form.vue'

const { t } = useI18n()
const emits = defineEmits(['submit', 'update'])
const showForm = ref<boolean>(false)
const isEdit = ref<boolean>(false)
const docTemplateCtx = inject(DocTemplateProveKey)
const variables = docTemplateCtx?.variables
const formRef = ref<FormInstance>()
const form = ref<DocTemplateVariable>({
  id: '',
  name: '',
  type: 'text',
  value: ''
})
const variableTypes: VariableType[] = ['text', 'list', 'table', 'link', 'signature']

function typeLabel(type: VariableType) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const valueEditorComponent = computed(() => {
  switch (form.value.type) {
    case 'text':
      return VariableValueText
    case 'list':
      return VariableValueList
    case 'table':
      return VariableValueTable
    case 'link':
      return VariableValueLink
    case 'image':
      return VariableValueImage
    case 'signature':
      return VariableSignatureForm
    default:
      return VariableValueText
  }
})

const rules = computed<FormRules>(() => ({
  name: [{ required: true, validator: checkName, trigger: 'blur' }],
  value: [{ required: true, message: 'Value is required', trigger: 'blur' }]
}))

function checkName(rule: any, value: any, callback: any) {
  if (!value) {
    return callback(new Error('Please input Name'))
  }

  if (value.startsWith('_')) {
    return callback(new Error("Name cannot start with '_'"))
  }

  // check if id has space and other special characters
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return callback(new Error('Name can only contain letters, numbers and underscores'))
  }

  if (!!variables?.value && variables?.value.filter((item: any) => item.name === value).length > 1) {
    return callback(new Error('Name is duplicated'))
  }

  callback()
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    emits(isEdit.value ? 'update' : 'submit', form.value)
    showForm.value = false
  } catch (error) {
    console.error(error)
  }
}

function open(variable?: DocTemplateVariable) {
  isEdit.value = !!variable
  if (variable) {
    form.value = { ...variable, name: variable.name ?? '', value: variable.value ?? '' }
  } else {
    form.value = {
      id: new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15),
      name: '',
      type: 'text' as VariableType,
      value: ''
    }
  }
  showForm.value = true
}

defineExpose({ open })
</script>

<template>
  <el-dialog
    v-model="showForm"
    :title="isEdit ? t('docTemplate.utils.variableManager.add') : t('docTemplate.variable.editVariable')"
    class="big"
    destroy-on-close
    append-to-body
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="Type">
        <el-select v-model="form.type" placeholder="Select type" :disabled="isEdit">
          <el-option v-for="type in variableTypes" :key="type" :label="typeLabel(type)" :value="type" />
        </el-select>
      </el-form-item>
      <el-form-item label="Value" prop="value">
        <component v-if="valueEditorComponent" :is="valueEditorComponent" v-model="form.value" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button id="Variable__Manage__Form__Submit" type="primary" @click="handleSubmit">
        {{ !isEdit ? 'Create' : 'Update' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
