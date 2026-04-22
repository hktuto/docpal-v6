<script lang="ts" setup>
import { VariableTypeOptions, type VariableItem, type VariableSelectItem } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { addVariableItem, updateVariableItem, getVariablesByType } = useVariablesProvide()
const comRef = ref()
const opened = ref(false)
const emits = defineEmits(['reload'])
const initData = {
  id: '',
  name: '',
  type: 'string',
  tag: 'text',
  required: false,
  maxLength: 200
}
const formData = ref<VariableItem>({
  ...initData
})
const editComponent = ref()
const exitRules = ref<VariableSelectItem[]>([])
const idFieldRef = ref()
const FormRef = ref()
const isEdit = ref(false)
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

function handleOpen(variable?: VariableSelectItem) {
  opened.value = true
  if (!!variable) {
    formData.value = { ...initData, ...variable }
    isEdit.value = true
  } else {
    formData.value = { ...initData }
    isEdit.value = false
  }

  exitRules.value = isEdit.value ? getVariablesByType().filter((item: any) => item.id !== variable?.id) : getVariablesByType()
  typeChanged(formData.value.tag)
  setTimeout(() => {
    if (idFieldRef.value) {
      idFieldRef.value?.focus()
    }
  }, 100)
}

function idChanged(rule: any, value: any, callback: any) {
  if (!value) {
    return callback(new Error('Please input id'))
  }

  if (value.startsWith('__system__')) {
    return callback(new Error("ID cannot start with '__system__'"))
  }

  // check if id has space and other special characters
  if (!/^[a-zA-Z0-9_]+$/.test(value)) {
    return callback(new Error('Id can only contain letters, numbers and underscores'))
  }

  if (!isEdit.value) {
    const isDuplicatedItem = getVariablesByType().find((item: any) => item.id === value)
    if (isDuplicatedItem) {
      return callback(new Error('Id is duplicated'))
    }
  }

  callback()
}

function typeChanged(tag: string) {
  const options = VariableTypeOptions.reduce((acc: any, item: any) => {
    acc.push(...item.options)
    return acc
  }, [])
  const typeObject = options.find((item: any) => item.tag === tag)

  if (!!typeObject) {
    formData.value = {
      id: formData.value.id,
      name: formData.value.name,
      type: Object.entries(VariableItemTag).find(([, arr]) => arr.includes(tag))?.[0],
      tag: tag,
      required: false,
      ...typeObject.validation
    }
    editComponent.value = resolveComponent(typeObject.component)
  }
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

async function confirmHandler() {
  graphProvider?.graph.value?.startBatch('update-variables')
  try {
    const vNode = graphProvider?.graph.value?.getCellById(graphProvider?.workflowId.value)
    await FormRef.value.validate()
    if (isEdit.value) {
      updateVariableItem(vNode, formData.value)
    } else {
      addVariableItem(vNode, formData.value)
    }
    emits('reload')
    opened.value = false
  } catch (error) {
    console.error(error)
  }
  graphProvider?.graph.value?.stopBatch('update-variables')
}

defineExpose({
  handleOpen
})
</script>

<template>
  <el-dialog v-model="opened" width="75%" append-to-body destroy-on-close :title="isEdit ? $t('bpmn.updateRule') : $t('bpmn.addGlobalRule')">
    <el-form ref="FormRef" :model="formData" :rules="newFieldRules" label-position="top" status-icon @submit.stop>
      <el-form-item label="ID" prop="id">
        <el-input ref="idFieldRef" v-model="formData.id" placeholder="id" :disabled="isEdit" />
      </el-form-item>
      <el-form-item label="Name" prop="name">
        <el-input v-model="formData.name" placeholder="Name" />
      </el-form-item>
      <el-form-item label="Type" prop="type">
        <el-select v-model="formData.tag" placeholder="Select" @change="typeChanged">
          <el-option-group v-for="group in VariableTypeOptions" :key="group.group" :label="$t(group.group)">
            <el-option v-for="option in group.options" :key="option.tag" :label="$t(option.label)" :value="option.tag" />
          </el-option-group>
        </el-select>
      </el-form-item>

      <el-divider />
      <component ref="comRef" v-if="editComponent" :is="editComponent" v-bind="formData" :form="formData" />

      <el-form-item>
        <ElButton id="Workflow__EditField__AddField__Confirm" type="primary" @click="confirmHandler">{{ $t('dpButtom_confirm') }}</ElButton>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
