<script lang="ts" setup>

const modelValue = defineModel('modelValue', {
  default: [],
  required: true
})

const localValue = computed({
  get: () => modelValue.value,
  set: (value) => {
    modelValue.value = value
  }
})

function add() {
  console.log('Add new field dialog should open')
}

defineExpose({
  add
})
</script>

<template>
  <div>
     {{ localValue }}
  </div>
</template>
