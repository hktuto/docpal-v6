<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'
import { Codemirror } from 'vue-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { linter } from '@codemirror/lint'

const { node } = defineProps<{
  node: Node
}>()
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const extensions = [json(), linter(jsonParseLinter()), oneDark]
const state = reactive({
  data: '',
  showDialog: false,
  errorMessage: ''
})

const jsonData = ref({})

function handleJsonFormat() {
  if (!checkJsonFormat()) {
    state.data = JSON.stringify(JSON.parse(state.data), null, 2)
    state.errorMessage = ''
  }
}

function checkJsonFormat() {
  try {
    JSON.parse(state.data)
    state.errorMessage = ''
    return false
  } catch (e) {
    console.log(e)
    state.errorMessage = `Unable to format JSON: ${e.message}`
    return true
  }
}

function init() {
  jsonData.value = node.getData().config
  state.data = JSON.stringify(jsonData.value)
}

function updateData() {
  graphProvider?.graph.value?.startBatch('update-script-field-data')

  const data = node.getData()
  const newData = {
    config: jsonData.value,
    version: (data.version || 0) + 1
  }
  node.setData(newData, { overwrite: true, deep: true, silent: false })
  graphProvider?.graph.value?.stopBatch('update-script-field-data')
}

function handleSave() {
  jsonData.value = JSON.parse(state.data)
  updateData()
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
  <el-button @click="state.showDialog = true" type="primary" style="width: 100%">Open Json Edit</el-button>
  <el-dialog v-model="state.showDialog" class="big" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="false">
    <el-button @click="handleJsonFormat">JSON Format</el-button>
    {{ errorMessage }}
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
