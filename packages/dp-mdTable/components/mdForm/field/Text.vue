<template>
  <MdFormItem v-bind="props" :rules="rules">
    <ElInput
      v-if="formData && modelField"
      v-model="formData[modelField]"
      :placeholder="column.placeholder"
      :disabled="disabled"
      clearable
      @keydown.enter.prevent.stop="handleEnter"
    />
  </MdFormItem>
</template>

<script setup lang="ts">
import { ColumnFieldType } from '@packages/dp-mdTable/types/column-types'
import { resolveColumnDataField } from '@packages/dp-mdTable/utils/fieldValueFormat'
const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()
const modelField = computed(() => resolveColumnDataField(props.column, props.fieldName))
const rules = computed(() => {
  if (!props.column) {
    return []
  }
  const rules: any[] = []
  if (props.column.required) {
    rules.push({
      required: true,
      message: '请输入内容',
      trigger: 'change'
    })
  }
  if (props.column.type === ColumnFieldType.Phone) {
    rules.push({
      pattern: /^(5|6|8|9)\d{7}$|^1[3-9]\d{9}$|^(0\d{2,3}-?\d{7,8})$|^(2[0-9]{1}|3[0-9]{1}|5[0-9]{1}|6[0-9]{1}|7[0-9]{1}|8[0-9]{1}|9[0-9]{1})\d{7}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    })
  } else if (props.column.type === ColumnFieldType.Email) {
    rules.push({
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: '请输入正确的邮箱',
      trigger: 'blur'
    })
  }
  return rules
})
function handleEnter(event: KeyboardEvent) {
  event.preventDefault()
  event.stopPropagation()
  const currentElement = event.target as HTMLElement | null
  if (!currentElement) {
    return
  }
  const formElement = currentElement.closest('.el-form')
  if (!formElement) {
    return
  }

  const focusableSelector = [
    'input:not([type="hidden"]):not([disabled]):not([readonly])',
    'textarea:not([disabled]):not([readonly])',
    'select:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])'
  ].join(', ')

  const focusableElements = Array.from(formElement.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    return element.getClientRects().length > 0
  })

  const currentIndex = focusableElements.indexOf(currentElement)
  if (currentIndex < 0) {
    return
  }
  const nextElement = focusableElements[currentIndex + 1]
  nextElement?.focus()
}
</script>

<style lang="scss" scoped></style>
