<template>
  <MdFormItem v-bind="props" :rules="rules">
    <ElInput v-if="formData && column.field" v-model="formData[column.field]" :placeholder="column.placeholder" clearable />
  </MdFormItem>
</template>

<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
const rules = computed(() => {
  if(!props.column) {
    return []
  }
  const rules: any[] = []
  if(props.column.required) {
    rules.push(
      {
        required: true,
        message: '请输入内容',
        trigger: 'change'
      }
    )
  }
  if(props.column.type === ColumnFieldType.Phone) {
    rules.push(
      {
        pattern: /^(5|6|8|9)\d{7}$|^1[3-9]\d{9}$|^(0\d{2,3}-?\d{7,8})$|^(2[0-9]{1}|3[0-9]{1}|5[0-9]{1}|6[0-9]{1}|7[0-9]{1}|8[0-9]{1}|9[0-9]{1})\d{7}$/,
        message: '请输入正确的手机号',
        trigger: 'blur'
      }
    )
  }
  else if(props.column.type === ColumnFieldType.Email) {
    rules.push(
      {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        message: '请输入正确的邮箱',
        trigger: 'blur'
      }
    )
  }
  return rules
})
</script>

<style lang="scss" scoped></style>
