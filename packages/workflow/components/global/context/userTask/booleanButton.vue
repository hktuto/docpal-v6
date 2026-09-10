<script lang="ts" setup>
import type { Node } from '@antv/x6'
import { createError } from '#imports'

const { node } = defineProps<{
  node: Node
}>()
const emits = defineEmits(['update'])

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { getVariablesByDisplayTypes } = useVariablesProvide()
const buttonStyle = ['primary', 'success', 'warning', 'danger', 'info', 'text']
type buttonItem = {
  booleanValue: string
  buttonStyle: string
  buttonText: string
  applyState: true
}

const buttonSetting = ref<{
  showSubmitButton: boolean
  submitButtonLabel: string
  showSaveDraft: boolean
  saveDraftLabel: string
  booleanButton: buttonItem[]
}>({
  showSubmitButton: true,
  submitButtonLabel: 'Submit',
  showSaveDraft: true,
  saveDraftLabel: 'Save Draft',
  booleanButton: []
})
const allBooleanInfo = computed(() => {
  return getVariablesByDisplayTypes(['boolean'])
})

function init() {
  const nodeData = node.getData()
  if (!!nodeData.metadata.buttonSetting) {
    buttonSetting.value = nodeData.metadata.buttonSetting
  }
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-boolean-button-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    metadata: {
      ...nodeData.metadata,
      buttonSetting: buttonSetting.value
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-boolean-button-data')
}

const defaultForm: buttonItem = {
  booleanValue: '',
  buttonStyle: 'primary',
  buttonText: 'Submit',
  applyState: true
}
function addButton() {
  if (!buttonSetting.value.booleanButton) {
    buttonSetting.value.booleanButton = []
  }

  buttonSetting.value.booleanButton.push({
    ...defaultForm
  })
}

function handleRemoveBooleanItem(index: number) {
  buttonSetting.value.booleanButton.splice(index, 1)
  updateData()
}

watch(
  () => node,
  async () => {
    if (node) {
      init()
    }
  },
  {
    immediate: true,
    deep: true
  }
)

onMounted(() => {
  useWorkflowAdditionalContext(init)
})
</script>

<template>
  <div class="formContainer">
    <div class="settings-card">
      <span class="settings-title">Button Setting</span>
      <el-form label-position="top" class="button-setting-form">
        <div class="setting-row">
          <p>Submit Button</p>
          <el-switch size="small" v-model="buttonSetting.showSubmitButton" active-text="Show" inactive-text="Disabled" @change="updateData" />
        </div>
        <el-input v-if="buttonSetting.showSubmitButton" v-model="buttonSetting.submitButtonLabel" @change="updateData" />

        <template v-if="node.data.metadata.type === 'UserTask'">
          <div class="setting-row">
            <p>Show Save Draft Button</p>
            <el-switch size="small" v-model="buttonSetting.showSaveDraft" active-text="Show" inactive-text="Disabled" @change="updateData" />
          </div>
          <el-input v-if="buttonSetting.showSaveDraft" v-model="buttonSetting.saveDraftLabel" @change="updateData" />
        </template>
      </el-form>
    </div>

    <template v-if="allBooleanInfo.length === 0">No Boolean Field to set</template>
    <div v-else class="listContainer">
      <template v-for="(item, index) in buttonSetting.booleanButton">
        <el-form :model="item" label-position="top" class="listItem">
          <el-form-item label="Which field to set when clicked">
            <el-select v-model="item.booleanValue" placeholder="Document Step" filterable @change="updateData">
              <el-option v-for="item in allBooleanInfo" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="What State to apply">
            <el-switch v-model="item.applyState" active-text="True" inactive-text="False" @change="updateData" />
          </el-form-item>
          <el-form-item label="Button Color">
            <el-select v-model="item.buttonStyle" placeholder="Button Style" filterable @change="updateData">
              <el-option v-for="item in buttonStyle" :key="item" :label="item" :value="item">
                <div class="flex items-center">
                  <el-button :type="item" size="small">{{ item }}</el-button>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Button Text">
            <el-input v-model="item.buttonText" placeholder="Button Text" @change="updateData" />
          </el-form-item>
          <el-form-item>
            <el-button type="danger" @click="handleRemoveBooleanItem(index)">Remove</el-button>
          </el-form-item>
        </el-form>
      </template>
      <div class="actions">
        <el-button v-if="node.data.type !== 'StartEvent'" text @click="addButton">Add</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.formContainer {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.settings-card {
  padding: var(--app-space-s);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-m);
  background: var(--el-fill-color-lighter);
}

.settings-title {
  display: block;
  margin-bottom: var(--app-space-s);
  font-weight: 600;
}

.button-setting-form {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
}

.setting-row p {
  margin: 0;
}

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
