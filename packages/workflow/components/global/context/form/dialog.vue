<script setup lang="ts">
import type { Node } from '@antv/x6'
import { newClientApi } from 'api'

const { node, processKey, variables, formKey } = defineProps<{
  node: Node
  processKey: string
  variables: any
  formKey: string
}>()
const emits = defineEmits(['submit'])
const FormDesignRef = ref()
const formDialogVisible = ref(false)
const oldJson = ref({})
const allVariables = computed(() => {
  const data: any[] = variables.data
  const newList = data.flatMap((item) => {
    if (item.display_type !== 'array' && item.display_type !== 'object') return item

    if (item.items.type === 'object' && !!item.items.properties) {
      const map = Object.entries(item.items.properties).map(([key, value]) => ({
        id: key,
        ...value
      }))
      map.push(item)
      return map
    }
    return item
  })
  variables.data = Array.from(new Map(newList.map((item) => [item.id, item])).values())
  return variables
})

async function openDialog(json: any) {
  formDialogVisible.value = true
  oldJson.value = json
  nextTick(() => {
    FormDesignRef.value?.setFormJson(json)
  })
}

async function handleFormSubmit() {
  const json = FormDesignRef.value.getFormJson()
  if (JSON.stringify(json) === JSON.stringify(oldJson.value)) {
    formDialogVisible.value = false
    return
  }

  //  save e-form
  const params = {
    processKey: processKey,
    userTaskId: node.id,
    jsonValue: JSON.stringify(json),
    versionId: '0'
  }
  if (!!formKey && formKey != '') {
    params.id = formKey
    params.versionId = String(Number(params.versionId) + 1)
  }
  const data: any = await newClientApi.postDmsFormPropertiesSave(params).then((r) => r.data)
  emits('submit', data.id)
  formDialogVisible.value = false
}

defineExpose({ openDialog })
</script>

<template>
  <el-dialog v-model="formDialogVisible" fullscreen class="bpmn-vform--dialog" width="100%" top="0" append-to-body destroy-on-close>
    <FormDesigner ref="FormDesignRef" :fieldListApi="allVariables">
      <template #submit>
        <el-button type="primary" @click="handleFormSubmit">
          {{ $t('submit') }}
        </el-button>
      </template>
    </FormDesigner>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
