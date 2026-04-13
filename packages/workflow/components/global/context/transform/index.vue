<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'
import { Plus, Close } from '@element-plus/icons-vue'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { getVariablesByType } = useVariablesProvide()
const variableList = computed(() => {
  return getVariablesByType()
})
const contextTransformDialogRef = ref()
const dataMapping = ref<Record<string, string>>({})
const dataMappingList = computed(() => {
  return Object.entries(dataMapping.value).map(([key, value]) => ({
    id: key,
    label: variableList.value.find((item: any) => item.id === key)?.name,
    value: value
  }))
})

function openDataMappingDialog() {
  contextTransformDialogRef.value.open()
}

function handleCreate(visibleItem: any) {
  dataMapping.value = {
    ...dataMapping.value,
    ...visibleItem
  }
  updateData()
}
function handleDeleteMapping(id: string) {
  delete dataMapping.value[id]
  updateData()
}

function init() {
  const data = node.getData()
  dataMapping.value = data.config?.mapping
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-transform-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      ...nodeData.config,
      mapping: {
        ...dataMapping.value
      }
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-transform-data')
}

watch(
  () => node,
  async () => {
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

  <el-divider />

  <div class="mapping-label">
    <span class="mapping-label__text">Data Mapping</span>
    <el-icon @click="openDataMappingDialog">
      <Plus />
    </el-icon>
  </div>

  <template v-for="item in dataMappingList" :key="item.value">
    <div class="mapping-item">
      <span>{{ item.label }}</span>
      -
      <span>{{ item.value }}</span>
      <el-icon @click="handleDeleteMapping(item.id)"><Close /></el-icon>
    </div>
  </template>

  <LazyContextTransformDialog ref="contextTransformDialogRef" :dataMapping="dataMapping" @create="handleCreate" />
</template>

<style scoped lang="scss">
:deep(.el-form-item__label) {
  width: 100%;
}

.mapping-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.mapping-label__text {
  font-weight: 600;
}

.mapping-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 10px;
  margin-top: 10px;
}
</style>
