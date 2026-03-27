<script lang="ts" setup>
import { ElButton } from 'element-plus';

const { 
    attr_buttonStyle = "primary",
     attr_buttonText = "Submit", 
     attr_booleanValue, 
     attr_applyState,
     } = defineProps<{
    xml: string,
    taskDetail: any
    formData:any,
    attr_booleanValue: string,
    attr_buttonStyle: string,
    attr_buttonText: string,
    attr_applyState: boolean,
}>()
const workflowProvider = inject("workflowFormRender")

const emits = defineEmits(['submit'])

async function beforeSubmit(){
  return {
    [attr_booleanValue]: !attr_applyState
  };
}

async function submit(){
    //
    // step 1 get latest form data
    const formData = await workflowProvider?.getFormData(false, false)
    if(!formData) return
    // step 2 update form data
    formData[attr_booleanValue] = attr_applyState
    console.log("formData", formData)
    // workflowProvider?.updateData(formData)
    emits('submit', {formData, attr_booleanValue})
}

defineExpose({ beforeSubmit, attr_booleanValue })
</script>


<template>
    <ElButton :type="attr_buttonStyle"  @click="submit">{{  attr_buttonText }}</ElButton>
</template>
