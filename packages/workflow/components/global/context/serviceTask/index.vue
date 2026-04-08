<script setup lang="ts">
import type { Node } from '@antv/x6'
import { contextMenuComponentType, GetServiceList, getServiceTaskItemConfig } from '#imports'

const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { t } = useI18n()

const editComponent = ref()
const selectedServiceConfig = ref()
const serviceType = ref('')

const formData = ref<{
  config: any
}>({
  config: {}
})

function handleChangeService() {
  editComponent.value = resolveComponent(contextMenuComponentType[serviceType.value])
  selectedServiceConfig.value = getServiceTaskItemConfig[serviceType.value]

  console.log(node.getData())
}

function update() {
  graphProvider?.graph.value?.startBatch('update-service-task-data')
  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: formData.value.config,
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true })
  graphProvider?.graph.value?.stopBatch('update-service-task-data')
}

function handleUpdateConfig(config: any) {
  formData.value.config = config
  update()
}
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top">
    <el-form-item :label="t('Service Task Type')">
      <el-select v-model="serviceType" @change="handleChangeService">
        <el-option v-for="item in GetServiceList" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </el-form>

  <component v-if="editComponent" :is="editComponent" :config="selectedServiceConfig" @update="handleUpdateConfig" />
</template>

<style scoped lang="scss"></style>
