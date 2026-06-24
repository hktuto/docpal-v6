<script setup lang="ts">
import { MenuRouterKey } from '@packages/base/utils/menuType'

const opened = ref(false)
const isEdit = ref(false)
const comRef = ref()
const editComponent = ref()
const { properties } = defineProps<{
  properties: any[]
}>()
const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['add', 'update'])
const formData = ref({
  id: '',
  name: '',
  description: '',
  type: 'string',
  display_type: 'text',
  required: false,
  default_value: undefined,
  validation: {}
})
const displayTypeList = ref([
  {
    label: 'Text',
    type: 'string',
    display_type: 'text',
    validation: {
      max_length: 255,
      min_length: 1
    },
    component: 'ContextVariableDataTypeString'
  },
  {
    label: 'Number',
    type: 'number',
    display_type: 'number',
    validation: {
      max_value: 100,
      min_value: 1,
      decimal_places: 0
    },
    component: 'ContextVariableDataTypeNumber'
  },
  {
    label: 'Boolean',
    type: 'boolean',
    display_type: 'boolean',
    validation: {},
    component: 'ContextVariableDataTypeBoolean'
  },
  {
    label: 'Date',
    type: 'date',
    display_type: 'date',
    validation: {
      pattern: 'YYYY-MM-DD hh:mm:ss'
    },
    component: 'ContextVariableDataTypeDate'
  }
])
const exitRules = ref([])
const FormRef = ref()
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

  if (value.startsWith('_')) {
    return callback(new Error("ID cannot start with '_'"))
  }

  if (value.startsWith('__system__')) {
    return callback(new Error("ID cannot start with '__system__'"))
  }

  // check if id has space and other special characters
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return callback(new Error('Id can only contain letters, numbers and underscores'))
  }

  if (!isEdit.value) {
    const isDuplicatedItem = deepCopy(properties).find((item: any) => {
      if (item.id === value) return item
    })
    if (isDuplicatedItem) {
      return callback(new Error('Id is duplicated'))
    }
  }
  callback()
}

function newNameChanged(rule: any, value: any, callback: any) {
  if (!value) {
    return callback(new Error('Please input Name'))
  }
  const isDuplicatedItem = exitRules.value.some((item: any) => item.name === value)
  if (isDuplicatedItem) {
    return callback(new Error('Name is duplicated'))
  }
  callback()
}

function open(row: any) {
  opened.value = true
  formData.value = row
  isEdit.value = row.id !== ''
  exitRules.value = isEdit.value ? properties.filter((item: any) => item.id !== row?.id) : properties
  typeChanged(formData.value.display_type)
}

function typeChanged(displayType: string) {
  const typeObject: any = displayTypeList.value.find((item: any) => item.display_type === displayType)
  formData.value = {
    id: formData.value.id,
    name: formData.value.name,
    description: formData.value.description,
    type: typeObject.type,
    display_type: displayType,
    required: formData.value.required,
    default_value: formData.value.default_value,
    validation: typeObject.validation
  }
  editComponent.value = resolveComponent(typeObject.component)
}

function handleSubmit() {
  if (isEdit.value) {
    emits('update', formData.value)
  } else {
    if (properties.find((item: any) => item.id === formData.value.id)) {
      routerProvider?.message.error('Item Id is exist')
      return
    }
    emits('add', formData.value)
  }
  opened.value = false
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="opened" title="Item" class="big" append-to-body destroy-on-close :close-on-click-modal="false">
    <el-form ref="FormRef" :model="formData" :rules="newFieldRules" label-position="top">
      <el-form-item label="ID" prop="id">
        <el-input ref="idFieldRef" v-model="formData.id" placeholder="id" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="Name" prop="name">
        <el-input v-model="formData.name" placeholder="Name" />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="formData.display_type" placeholder="Select" @change="typeChanged">
          <el-option v-for="option in displayTypeList" :key="option.display_type" :label="$t(option.label)" :value="option.display_type" />
        </el-select>
      </el-form-item>
      <el-form-item label="Required">
        <el-switch v-model="formData.required" />
      </el-form-item>
      <el-divider />
      <component ref="comRef" v-if="editComponent" :is="editComponent" v-bind="formData" :form="formData" />
    </el-form>

    <template #footer>
      <el-button type="primary" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
