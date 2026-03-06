<script setup lang="ts">
const { getVariablesByType } = useVariablesProvide()

const variables = ref([])
const formDialogVisible = ref(false)

function openDialog(node: any) {
  formDialogVisible.value = true
}

function handleFormSubmit() {
  formDialogVisible.value = false
}

onMounted(() => {
  variables.value = getVariablesByType()
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
