<script setup lang="ts">
import type { AttachmentCellValue } from '../../../../types/column-types'
import { resolveColumnDataField } from '../../../../utils/fieldValueFormat'
import { normalizeAttachmentValue } from '../../../../renderers/components/Attachment/view'
import AttachmentUpload from './upload.vue'

const { t } = useI18n()

const props = defineProps<{
  formData: Record<string, any>
  column: any
  fieldName: string
  disabled: boolean
}>()

const modelField = computed(() => resolveColumnDataField(props.column, props.fieldName))

const attachments = computed({
  get: () => {
    if (!props.formData || !modelField.value) return []
    return normalizeAttachmentValue(props.formData[modelField.value])
  },
  set: (value) => {
    if (props.formData && modelField.value) {
      props.formData[modelField.value] = value
    }
  }
})

const canUpload = computed(() => Boolean(props.formData?.id && modelField.value && !props.disabled))

const rules = computed(() => {
  if (!props.column?.required) return []
  return [
    {
      validator: (_rule: unknown, _value: unknown, callback: (error?: Error) => void) => {
        if (attachments.value.length > 0) {
          callback()
          return
        }
        callback(new Error(t('mdTable.attachment.uploadRequired')))
      },
      trigger: 'change'
    }
  ]
})
</script>

<template>
  <MdFormItem v-if="formData && modelField" v-bind="props" :rules="rules">
    <AttachmentUpload
      v-model="attachments"
      mode="form"
      :data-id="formData.id"
      :field-name="modelField"
      :disabled="disabled"
      :show-upload="!disabled"
      :upload-disabled="!canUpload"
      :upload-hint="canUpload ? undefined : t('mdTable.attachment.saveBeforeUpload')"
    />
  </MdFormItem>
</template>
