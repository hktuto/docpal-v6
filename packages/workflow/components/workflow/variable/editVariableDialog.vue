<script lang="ts" setup>
import { METADATA_OPTIONS } from '#imports'
const { addVariableItem, updateVariableItem, getVariablesByType } = useVariablesProvide()

const opened = ref(false)
const emits = defineEmits(['reload'])

let exitRules = []
const idFieldRef = ref()
function handleOpen(variables: any) {
  if (!!variables) {
    isEdit.value = true

    return
  }

  formData.value = editField.type ? { ...editField } : { ...initData, ...editField }
  if (!!editField.type) {
    formData.value = { ...editField }
    isEdit.value = editField.type
  } else {
    formData.value = { ...initData, ...editField }
    isEdit.value = false
  }

  exitRules = isEdit.value ? bpmnGlobalRules.value.filter((item: any) => item.id !== editField.id) : bpmnGlobalRules.value
  opened.value = true
  setTimeout(() => {
    if (idFieldRef.value) {
      idFieldRef.value?.focus()
    }
  }, 100)
}

const FormRef = ref()
const isEdit = ref(false)
const initData = {
  id: '',
  name: '',
  type: 'text',
  maxLength: 200
}
const formData = ref({
  ...initData
})
const newFieldRules = reactive({
  id: [
    {
      required: true,
      validator: idChanged,
      trigger: 'blur'
    }
  ],
  name: [
    {
      required: true,
      validator: newNameChanged,
      trigger: 'blur'
    }
  ]
})

function idChanged(rule: any, value: any, callback: any) {
  if (!value) {
    return callback(new Error('Please input id'))
  }
  // check if id has space and other special characters
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return callback(new Error('Id can only contain letters, numbers and underscores'))
  }
  const isDuplicatedItem = getVariablesByType().find((item: any) => item.id === value)
  if (isDuplicatedItem) {
    return callback(new Error('Id is duplicated'))
  }
  callback()
}

function typeChanged(value: any) {
  const options = METADATA_OPTIONS.reduce((acc: any, item: any) => {
    acc.push(...item.options)
    return acc
  }, [])
  const type = options.find((item: any) => item.validation.validationRuleName === value)
  if (type) {
    formData.value = {
      ...formData.value,
      ...type.validation
    }
    delete formData.value.validationRuleName
    if (formData.value.type !== 'text') delete formData.value.maxLength
  }
}
function newNameChanged(rule: any, value: any, callback: any) {
  if (!value) {
    return callback(new Error('Please input Name'))
  }
  const isDuplicatedItem = exitRules.some((item: any) => item.name === value)
  if (isDuplicatedItem) {
    return callback(new Error('Name is duplicated'))
  }
  callback()
}

async function confirmHandler() {
  try {
    await FormRef.value.validate()
    if (isEdit.value) {
      updateVariableItem(formData.value)
    } else {
      addVariableItem(formData.value)
    }
    emits('reload')
    opened.value = false
  } catch (error) {
    console.error(error)
  }
}
onMounted(() => {})

defineExpose({
  handleOpen
})
</script>

<template>
  <ElDialog
    v-model="opened"
    width="75%"
    append-to-body
    destroy-on-close
    :title="isEdit ? $t('bpmn.updateRule') : mode === 'global' ? $t('bpmn.addGlobalRule') : $t('bpmn.addRule')"
  >
    <ElForm ref="FormRef" :model="formData" :rules="newFieldRules" label-position="top" status-icon @submit.stop>
      <ElFormItem label="ID" prop="id">
        <ElInput ref="idFieldRef" v-model="formData.id" placeholder="id" :disabled="isEdit" />
      </ElFormItem>
      <ElFormItem label="Name" prop="name">
        <ElInput v-model="formData.name" placeholder="Name" />
      </ElFormItem>
      <ElFormItem label="Type" prop="type">
        <el-select v-model="formData.type" placeholder="Select" @change="typeChanged">
          <el-option-group v-for="group in METADATA_OPTIONS" :key="group.group" :label="$t(group.group)">
            <el-option v-for="option in group.options" :key="option.name" :label="$t(option.name)" :value="option.validation.validationRuleName" />
          </el-option-group>
        </el-select>
      </ElFormItem>
      <DataTypeText v-if="formData.type === 'text'" :form="formData" />
      <DataTypeNumber v-else-if="formData.type === 'number'" :form="formData" />
      <DataTypeBoolean v-else-if="formData.type === 'boolean'" :form="formData" />
      <DataTypeSelect v-else-if="formData.type === 'select'" :form="formData" />
      <DataTypeDate v-else-if="formData.type === 'date'" :form="formData" />
      <DataTypeDocument v-else-if="formData.type === 'document'" :form="formData" />
      <DataTypeCase v-else-if="formData.type === 'case'" :form="formData" />
      <DataTypeWorkflow v-else-if="formData.type === 'workflow'" :form="formData" />
      <DataTypeMasterTable v-else-if="formData.type === 'mastertable'" :form="formData" />
      <DataTypeUser v-else-if="formData.type === 'user'" :form="formData" />
      <DataTypeUserRoleUserGroup v-else-if="formData.type === 'user_role_user_group'" :form="formData" />
      <!-- 根据type显示不同的表单项 -->
      <ElFormItem>
        <ElButton id="Workflow__EditField__AddField__Confirm" type="primary" @click="confirmHandler">{{ $t('dpButtom_confirm') }}</ElButton>
      </ElFormItem>
    </ElForm>
  </ElDialog>
</template>
