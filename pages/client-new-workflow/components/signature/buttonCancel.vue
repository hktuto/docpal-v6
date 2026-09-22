<script lang="ts" setup>
import { generateData, replaceVariables } from 'docpal-document-editor/src/utils'
import { convertWorkflowVariableToTemplateVariable } from '@packages/workflow/utils/workflowHelper'

const props = defineProps<{
  disabled?: boolean
  buttonId?: string
}>()

const {
  signatureDetail,
  temSignatureData,
  formDataValue,
  signSubmitStage,
  disabled: formDisabled,
  getFormData
} = useWorkflowFormInject()

const loading = ref(false)
const isDisabled = computed(() => props.disabled ?? formDisabled.value)

async function handleCancel() {
  if (!signatureDetail.value) return

  loading.value = true
  try {
    const data = await getFormData(false, false)
    data[signatureDetail.value.workflowKeyToStoreSignature] = null
    const allFormData = {
      ...formDataValue.value,
      ...data
    }
    const templateVariables = convertWorkflowVariableToTemplateVariable(
      allFormData,
      signatureDetail.value.workflowToTemplateMapping
    )

    if (signatureDetail.value.signatureVariableSetting) {
      templateVariables[signatureDetail.value.signatureVariableSetting.id] =
        signatureDetail.value.templateVariables[signatureDetail.value.signatureVariableSetting.id]
    }
    const newVariables = generateData(templateVariables, JSON.parse(JSON.stringify(signatureDetail.value.templateDetail)))
    const content = signatureDetail.value.templateDetail.json.content.content
    signatureDetail.value.templateDetail.json.content.content = replaceVariables(content, newVariables.variables)
    temSignatureData.value = null
    signSubmitStage.value = 'beforeSubmit'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <el-button
    :id="buttonId || 'Workflow__AvailableTask__Detail__Form__Cancel'"
    :disabled="isDisabled"
    :loading="loading"
    @click="handleCancel"
  >
    {{ $t('cancelText') }}
  </el-button>
</template>
