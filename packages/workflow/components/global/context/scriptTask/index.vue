<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}

const extensions = [javascript({ typescript: true }), oneDark]
const state = reactive({
  data: '',
  showDialog: false
})

function init() {
  state.data = ''
  const data = node.getData()
  const script = data.config.script
  if (script.language == 'javascript') {
    state.data = script.script || ''
  } else if (script.language == 'cel') {
  }
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-script-field-data')

  const data = node.getData()
  const newData = {
    ...data,
    config: {
      ...data.config,
      script: {
        ...data.config.script,
        script: state.data
      }
    },
    version: (data.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-script-field-data')
}

function handleSave() {
  updateData()
  state.showDialog = false
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

  <el-button @click="state.showDialog = true" type="primary" style="width: 100%">Open Script Edit</el-button>

  <el-dialog v-model="state.showDialog" class="big" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="false">
    <el-alert type="success" title="You can get and set data through vars.get('key') and result.set('key', 'value')" />
    <div ref="codeMirrorRef">
      <codemirror
        v-model="state.data"
        :style="{ width: '100%', height: '75vh' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
      />
    </div>
    <template #footer>
      <el-button type="primary" @click="handleSave">Save</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
