<template>
  <MdFormItem v-bind="props">
    <Icon v-if="column?.display_structure?.icon"
      :name="column.display_structure.icon"
      :class="{ 'cursor-pointer': true, 'checkbox-active': formData[column[fieldName]] }"
      @click="handleClick"/>
    <!-- <ElCheckbox v-model="formData[column.field]" :placeholder="column.placeholder" clearable /> -->
  </MdFormItem>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()
const handleClick = () => {
  if(props.disabled) return;
  props.formData[props.column[props.fieldName]] = !props.formData[props.column[props.fieldName]]
}
</script>
<style lang="scss" scoped>
.checkbox-active {
  color: #409EFF;
}
</style>
