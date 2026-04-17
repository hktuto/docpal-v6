<script setup lang="ts">
import type { Node } from '@antv/x6'
import { createError } from '#imports'
const graphProvider = inject(WORKFLOW_EDITOR_PROVIDER)
if (!graphProvider) {
  throw createError('graph provider not found')
}
const { node } = defineProps<{
  node: Node
}>()
const form = ref({
  documentStepId: '',
  signatureValue: ''
})
const signatureVariable = ref([])
const allDocumentStep = computed(() => {
  return []
})

function init() {
  const allNodes = graph.getNodes()

}

function getTemplateVariableList() {}
onMounted(() => {
  init()
})
</script>

<template>
  <ElForm :model="form" label-position="top" class="listItem">
    <ElFormItem label="Document Generate Step">
      <ElSelect v-model="form.documentStepId" placeholder="Document Step" filterable clearable @change="getTemplateVariableList">
        <ElOption v-for="item in allDocumentStep" :key="item.value" :label="item.label" :value="item.value" />
      </ElSelect>
    </ElFormItem>
    <ElFormItem label="Signature">
      <ElSelect v-model="form.signatureValue" placeholder="Signature" filterable clearable>
        <ElOption v-for="item in signatureVariable" :key="item.id" :label="item.name" :value="item.id" />
      </ElSelect>
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="scss"></style>
