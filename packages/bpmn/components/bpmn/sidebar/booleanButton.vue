<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()

const graphProvider = inject(BPMN_PROVIDER)
const editorProvider = inject(EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('graph provider not found')
}

const buttonStyle = ['primary', 'success', 'warning', 'danger', 'info', 'text']

const form = ref<any>([])

const buttonSetting = ref({
  showSubmitButton: true,
  submitButtonLabel: 'Submit',
  showSaveDraft: true,
  saveDraftLabel: 'Save Draft'
})

function getForm() {
  const nodeData = node.getData()
  if (nodeData.data && nodeData.data.extensionElements && nodeData.data.extensionElements['docpal:booleanButton']) {
    if (!Array.isArray(nodeData.data.extensionElements['docpal:booleanButton'])) {
      form.value = [nodeData.data.extensionElements['docpal:booleanButton']]
    } else {
      form.value = nodeData.data.extensionElements['docpal:booleanButton']
    }
  } else {
    form.value = []
  }
}

const { bpmnGlobalRules } = editorProvider.BpmnRule
const allBooleanInfo = computed(() => {
  return bpmnGlobalRules.value.filter((item: any) => item.validationRule.type === 'boolean').map((item: any) => {
    return {
      attr_id: item.id,
      attr_name: item.name
    }
  })
})
function getButtonSetting() {
  const nodeData = node.getData()
  if (nodeData.data && nodeData.data.extensionElements && nodeData.data.extensionElements['docpal:buttonSetting']) {
    const oldSetting = nodeData.data.extensionElements['docpal:buttonSetting']
    // setting may change , assign new object to normailize data
    buttonSetting.value = {
      ...buttonSetting.value,
      ...oldSetting
    }
  }
}

function setButtonSetting() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    data: {
      ...nodeData.data,
      extensionElements: {
        ...nodeData.data.extensionElements,
        'docpal:buttonSetting': JSON.parse(JSON.stringify(buttonSetting.value))
      }
    }
  }
  node.setData(newData, {
    deep: true,
    overwrite: true
  })
}

function setForm() {
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    data: {
      ...nodeData.data,
      extensionElements: {
        ...nodeData.data.extensionElements,
        'docpal:booleanButton': JSON.parse(JSON.stringify(form.value))
      }
    }
  }
  node.setData(newData, {
    deep: true,
    overwrite: true
  })
}

type Form = {
  attr_booleanValue: string
  attr_buttonStyle: string
  attr_buttonText: string
  attr_applyState: boolean
}
const defaultForm: Form = {
  attr_booleanValue: '',
  attr_buttonStyle: 'primary',
  attr_buttonText: 'Submit',
  attr_applyState: true
}

function addButton() {
  form.value.push({
    ...defaultForm
  })
}

function init() {
  getForm()
  getButtonSetting()
}

useAdditionalContext(init)

watch(form, () => {
    setForm()
  }, { deep: true }
)

watch(buttonSetting, () => {
    setButtonSetting()
  }, { deep: true }
)

</script>

<template>
  <div class="formContainer">
    <h4>Boolean Button</h4>
    <div>
      <span>Button Setting</span>
      <el-form label-position="top">
        <el-form-item label="Show Submit Button">
          <el-switch v-model="buttonSetting.showSubmitButton" />
        </el-form-item>
        <el-form-item label="Submit Button Label">
          <el-input v-model="buttonSetting.submitButtonLabel" />
        </el-form-item>
        <template v-if="node.data.type !== 'startEvent'">
          <el-form-item label="Show Save Draft Button">
            <el-switch v-model="buttonSetting.showSaveDraft" />
          </el-form-item>
          <el-form-item label="Save Draft Button Label">
            <el-input v-model="buttonSetting.saveDraftLabel" />
          </el-form-item>
        </template>
      </el-form>
    </div>
    <template v-if="allBooleanInfo.length === 0"> No Boolean Field to set</template>
    <div v-else class="listContainer">
      <template v-for="(item, index) in form">
        <ElForm :model="item" label-position="top" class="listItem">
          <ElFormItem label="Which field to set when clicked">
            <ElSelect v-model="item.attr_booleanValue" placeholder="Document Step" filterable>
              <ElOption v-for="item in allBooleanInfo" :key="item.attr_id" :label="item.attr_name"
                        :value="item.attr_id" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="What State to apply">
            <ElSwitch v-model="item.attr_applyState" active-text="True" inactive-text="False" />
          </ElFormItem>
          <ElFormItem label="Button Color">
            <ElSelect v-model="item.attr_buttonStyle" placeholder="Button Style" filterable>
              <ElOption v-for="item in buttonStyle" :key="item" :label="item" :value="item">
                <div class="flex items-center">
                  <el-button :type="item" size="small">{{ item }}</el-button>
                </div>
              </ElOption>
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="Button Text">
            <ElInput v-model="item.attr_buttonText" placeholder="Button Text" />
          </ElFormItem>
          <ElFormItem>
            <ElButton type="danger" @click="form.splice(index, 1)">Remove</ElButton>
          </ElFormItem>
        </ElForm>
      </template>
      <div class="actions">
        <ElButton text @click="addButton">Add</ElButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.listContainer {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .listItem {
    width: 100%;
    padding: var(--app-space-s);
    border: 1px solid var(--app-grey-800);
    border-radius: var(--app-border-radius-m);
  }

  .actions {
    border-top: 1px solid var(--app-grey-800);
    padding-block: var(--app-space-s);
    display: flex;
    justify-content: center;
    gap: 10px;
  }
}
</style>
