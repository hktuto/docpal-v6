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
const { getVariablesByType } = useVariablesProvide()
const buttonStyle = ['primary', 'success', 'warning', 'danger', 'info', 'text']

const buttonSetting = ref({
  showSumBitButton: true,
  submitButtonLabel: 'Submit',
  showSaveDraft: true,
  saveDraftLabel: 'Save Draft'
})
const form = ref()

const allBooleanInfo = computed(() => {
  return getVariablesByType(['boolean'])
})

function init() {
  const nodeData = node.getData()
  if (!!nodeData.metadata.buttonSetting) {
    buttonSetting.value = nodeData.metadata.buttonSetting
  }
}

function setForm() {
  graphProvider?.graph.value?.startBatch('update-startTask-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    metadata: {
      ...nodeData.metadata,
      buttonSetting: {
        ...buttonSetting.value
      }
    },
    version: nodeData.version + 1 || 0
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-startTask-data')
}

function addButton() {}

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
    <h4>Boolean Button</h4>
    <div>
      <span>Button Setting</span>
      <el-form label-position="top">
        <el-form-item label="Show Submit Button">
          <el-switch v-model="buttonSetting.showSumBitButton" @change="setForm"/>
        </el-form-item>
        <el-form-item label="Submit Button Label">
          <el-input v-model="buttonSetting.submitButtonLabel" @change="setForm"/>
        </el-form-item>
        <template v-if="node.data.type !== 'startEvent'">
          <el-form-item label="Show Save Draft Button">
            <el-switch v-model="buttonSetting.showSaveDraft" @change="setForm"/>
          </el-form-item>
          <el-form-item label="Save Draft Button Label">
            <el-input v-model="buttonSetting.saveDraftLabel" @change="setForm"/>
          </el-form-item>
        </template>
      </el-form>
    </div>

    <template v-if="allBooleanInfo.length === 0">No Boolean Field to set</template>
    <div v-else class="listContainer">
      <template v-for="(item, index) in form">
        <el-form :model="item" label-position="top" class="listItem">
          <el-form-item label="Which field to set when clicked">
            <el-select v-model="item.booleanValue" placeholder="Document Step" filterable>
              <el-option v-for="item in allBooleanInfo" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="What State to apply">
            <el-switch v-model="item.applyState" active-text="True" inactive-text="False" />
          </el-form-item>
          <el-form-item label="Button Color">
            <el-select v-model="item.buttonStyle" placeholder="Button Style" filterable>
              <el-option v-for="item in buttonStyle" :key="item" :label="item" :value="item">
                <div class="flex items-center">
                  <el-button :type="item" size="small">{{ item }}</el-button>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Button Text">
            <el-input v-model="item.buttonText" placeholder="Button Text" />
          </el-form-item>
          <el-form-item>
            <el-button type="danger" @click="form.splice(index, 1)">Remove</el-button>
          </el-form-item>
        </el-form>
      </template>
      <div class="actions">
        <el-button text @click="addButton">Add</el-button>
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
