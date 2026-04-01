<script setup lang="ts">
import type { Node } from '@antv/x6'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { getVariablesByType } = useVariablesProvide()
const variableList = computed(() => {
  return getVariablesByType(['string'])
})

const outputMapping = ref({
  valid: '',
  errors: ''
})
const form = ref<any[]>([])

function init() {
  const nodeData = node.getData()
  form.value = nodeData.config.rules || []

  outputMapping.value = Object.fromEntries(Object.entries(nodeData.config?.output_mapping).map(([k, v]) => [v, k]))
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-validate-task-data')
  const otMapping = Object.fromEntries(Object.entries(outputMapping.value).map(([k, v]) => [v, k]))

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      rules: form.value,
      output_mapping: otMapping
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-validate-task-data')
}

function addNewRule() {
  if (graphProvider?.readonly.value) return

  const newRule = {
    expression: '',
    message: ''
  }
  form.value.push(newRule)
}

function updateRule(newVal: any, index: number) {
  form.value[index] = newVal
  updateData()
}

function deleteRule(index: number) {
  form.value.splice(index, 1)
  updateData()
}

watch(
  () => node,
  () => {
    init()
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top" :disabled="graphProvider.readonly.value">
    <el-form-item :label="t('Valid')">
      <el-select v-model="outputMapping.valid" @change="updateData">
        <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('Errors')">
      <el-select v-model="outputMapping.errors" @change="updateData">
        <el-option v-for="item in variableList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>

    <el-form-item :label="t('Data Rule Mapping')" />
    <div v-for="(element, index) in form" :key="index" class="group__item">
      <ContextValidateTaskRule :element="element" :index="index" @deleteRule="deleteRule" @updateRule="(newVal: any) => updateRule(newVal, index)" />
      <div class="addNewContainer" @click="addNewRule">
        <Icon name="lucide:circle-plus" />
        <div class="label">And</div>
      </div>
    </div>

    <div v-if="form.length === 0" :class="{ addNewContainer: true }" @click="addNewRule">
      <Icon name="lucide:circle-plus" />
      <div class="label">And</div>
    </div>
  </el-form>
</template>

<style scoped lang="scss">
.group__item {
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
  margin-top: 10px;
}

.addNewContainer {
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  gap: var(--app-space-xs);
  cursor: pointer;
  font-size: var(--app-font-size-m);
  margin-block: var(--app-space-xs);
  &:hover {
    color: var(--app-main-color);
  }
  //&.readonly {
  //  cursor: not-allowed;
  //  &:hover {
  //    color: initial;
  //  }
  //}
}
</style>
