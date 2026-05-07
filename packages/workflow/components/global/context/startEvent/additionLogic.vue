<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('starterAdditionLogic -> graph provider not found')
}
const openInNewPage = ref<boolean>(false)

function updateData() {
  const data = node.getData()
  const newData = {
    ...data,
    metadata: {
      ...data.metadata,
      openInNewPage: openInNewPage.value
    },
    version: (nodeData.version || 0) + 1
  }
  node.setData(newData, {
    deep: true,
    overwrite: true
  })
}

function init() {
  const data = node.getData()
  if (data.metadata.openInNewPage) {
    openInNewPage.value = data.metadata.openInNewPage
  } else {
    openInNewPage.value = false
  }
}

function setUpListener() {
  graphProvider?.graph.value?.on('history:undo', () => {
    init()
  })
  graphProvider?.graph.value?.on('history:redo', () => {
    init()
  })
}
onMounted(() => {
  setUpListener()
  init()
})

watch(
  () => node,
  () => {
    init()
  },
  {
    deep: true
  }
)
</script>

<template>
  <div class="formContainer">
    <h4>Additional Setting</h4>
    <el-form label-position="top">
      <el-form-item label="Open Form in new page">
        <el-switch :disabled="graphProvider.readonly.value" v-model="openInNewPage" @change="updateData" />
      </el-form-item>
    </el-form>
  </div>
</template>
