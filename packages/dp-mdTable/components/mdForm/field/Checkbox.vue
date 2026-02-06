<template>
  <MdFormItem v-bind="props">
    <Icon v-if="column?.properties?.icon" 
      :name="column.properties.icon" 
      :class="{ 'cursor-pointer': true, 'checkbox-active': formData[column.field] }" 
      @click="handleClick"/>
    <!-- <ElCheckbox v-model="formData[column.field]" :placeholder="column.placeholder" clearable /> -->
  </MdFormItem>
</template>
<script setup lang="ts">
const props = defineProps<{
  formData: any
  column: any
}>()
const handleClick = () => {
  props.formData[props.column.field] = !props.formData[props.column.field]
}
</script>
<style lang="scss" scoped>
.checkbox-active {
  color: #409EFF;
}
</style>
