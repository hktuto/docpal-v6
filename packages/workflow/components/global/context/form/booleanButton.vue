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
const { t } = useI18n()
const workflowProvider = inject('workflowFormRender')
const emits = defineEmits(['submit'])

function beforeSubmit() {
  return {
    [booleanValue]: !applyState
  }
}

async function submit() {
  try {
    const buttonData: Record<string, boolean> = {
      [booleanValue]: applyState
    }
    await workflowProvider?.updateData(buttonData)
    const formData = await workflowProvider?.getFormData(false, false, booleanValue)
    if (!formData) return
    formData[booleanValue] = applyState
    emits('submit', { formData, booleanValue })
  } catch (e) {
    // 阻擋button的附加事件(messageBox等) cancel事件導致的提交
    console.log(e)
  }
}

defineExpose({ beforeSubmit, booleanValue })
</script>

<template>
  <el-button :type="buttonStyle" @click="submit">
    {{ $t(buttonText) }}
  </el-button>
</template>

<style scoped lang="scss"></style>
