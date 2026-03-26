<script setup lang="ts">
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'

const { getVariablesByType } = useVariablesProvide()
const props = defineProps<{
  node: Node
  processKey: string
}>()
const emits = defineEmits(['submit'])
const FormDesignRef = ref()
const variables = computed(() => {
  const variableList = getVariablesByType()
  return {
    labelKey: 'name',
    nameKey: 'id',
    data: variableList
  }
})
const formDialogVisible = ref(false)

async function openDialog(json: any) {
  formDialogVisible.value = true
  nextTick(() => {
    FormDesignRef.value?.setFormJson(json)
  })
}

async function handleFormSubmit() {
  const json = FormDesignRef.value.getFormJson()
  //  save e-form
  const params = {
    processKey: props.processKey,
    userTaskId: props.node.id,
    jsonValue: JSON.stringify(json),
    versionId: '0'
  }
  if (props.node.data.metadata.formKey !== '' && props.node.data.metadata.formKey !== 0) {
    params.id = props.node.data.metadata.formKey
  }

  const data: any = await newAdminApi.postDmsFormPropertiesSave(params).then((r) => r.data)
  emits('submit', data.id)
  formDialogVisible.value = false
}

defineExpose({ openDialog })
</script>

<template>
  <el-dialog v-model="formDialogVisible" fullscreen class="bpmn-vform--dialog" width="100%" top="0" append-to-body destroy-on-close>
    <FormDesigner ref="FormDesignRef" :fieldListApi="variables">
      <template #submit>
        <ElButton type="primary" @click="handleFormSubmit">
          {{ $t('submit') }}
        </ElButton>
      </template>
    </FormDesigner>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
