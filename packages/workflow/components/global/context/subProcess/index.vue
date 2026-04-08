<script setup lang="ts">
import type { Node } from '@antv/x6'
import { getWorkflowList } from '@packages/workflow/utils/workflowHelper'

const { t } = useI18n()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const { workflowList } = await getWorkflowList()
const processDefinitionId = ref<string>('')

function initForm() {
  const data = node.getData()
  processDefinitionId.value = data.config?.processDefinitionId
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-sub-process-data')

  const nodeData = node.getData()
  const newData = {
    ...nodeData,
    config: {
      processDefinitionId: processDefinitionId.value
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-sub-process-data')
}


watch(
  () => node,
  async () => {
    if (node) {
      initForm()
    }
  },
  {
    immediate: true,
    deep: true
  }
)
</script>

<template>
  <SidebarLabel :node="node" />

  <el-form label-position="top">
    <el-form-item :label="t('Process Definition')">
      <el-select v-model="processDefinitionId" :placeholder="t('common_selectedIsRequiredMsg')" @change="updateData">
        <el-option v-for="item in workflowList" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
    </el-form-item>
  </el-form>
  
</template>

<style scoped lang="scss">

</style>
