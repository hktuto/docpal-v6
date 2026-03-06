<script lang="ts" setup>
import type { Node } from '@antv/x6'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_PROVIDER)
const editorProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider || !editorProvider) {
  throw createError('starterAdditionLogic -> graph provider not found')
}
type Form = {
  openInNewPage: boolean
}
const form = ref<Form>({
  openInNewPage: false
})

function updateData() {
  const nodeData = node.getData()
  const data = {
    ...nodeData,
    version: nodeData.version + 1 || 1,
    additionSetting: {
      openInNewPage: form.value.openInNewPage
    }
  }
  node.setData(data, {
    deep: true,
    overwrite: true
  })
}

function init() {
  const data = node.getData()
  if (!!data.config.additionSetting && data.config.additionSetting.openInNewPage) {
    form.value = data.config.additionSetting.openInNewPage
  } else {
    form.value = { openInNewPage: false }
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
    <ElForm label-position="top">
      <ElFormItem label="Open Form in new page">
        <ElSwitch :disabled="editorProvider.readonly.value" v-model="form.openInNewPage" @change="updateData" />
      </ElFormItem>
    </ElForm>
  </div>
</template>
