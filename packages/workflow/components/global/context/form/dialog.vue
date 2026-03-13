<script setup lang="ts">
import type { Node } from '@antv/x6'
import { newAdminApi } from 'api'

const { getVariablesByType } = useVariablesProvide()
const props = defineProps<{
  processKey: string
  userTaskId: string
  node: Node
}>()
const emits = defineEmits(['submit'])
const FormDesignRef = ref()
const variables = ref([])
const formDialogVisible = ref(false)

async function openDialog() {
  formDialogVisible.value = true
}

async function handleFormSubmit() {
  const json = FormDesignRef.value.getFormJson()
  //  save e-form
  // TODO: 該接口會不斷創建新的 E-form Json。每次返回的ID都是新的
  const data = await newAdminApi
    .postDmsFormPropertiesSave({
      processKey: props.processKey,
      userTaskId: props.userTaskId,
      jsonValue: JSON.stringify(json),
      versionId: 0
    })
    .then((r) => r.data)

  emits('submit', data.id)
  formDialogVisible.value = false
}

onMounted(() => {
  const variableList = getVariablesByType()
  variables.value = {
    labelKey: 'name',
    nameKey: 'id',
    data: variableList
  }
})

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
