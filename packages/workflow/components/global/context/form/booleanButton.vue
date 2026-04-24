<script setup lang="ts">
const {
  buttonStyle = 'primary',
  buttonText = 'Submit',
  booleanValue,
  applyState
} = defineProps<{
  booleanValue: string
  buttonStyle: string
  buttonText: string
  applyState: boolean
}>()
const workflowProvider = inject('workflowFormRender')
const emits = defineEmits(['submit'])

function beforeSubmit() {
  return {
    [booleanValue]: !applyState
  }
}

async function submit() {
  const formData = await workflowProvider?.getFormData(false, false)
  if (!formData) return
  formData[booleanValue] = applyState
  console.log('formData', formData, booleanValue)
  emits('submit', { formData, booleanValue })
}

defineExpose({ beforeSubmit, booleanValue })
</script>

<template>
  <el-button :type="buttonStyle" @click="submit">
    {{ buttonText }}
  </el-button>
</template>

<style scoped lang="scss"></style>
