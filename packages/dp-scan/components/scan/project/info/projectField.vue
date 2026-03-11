<script lang="ts" setup>
const additionFieldsSetting = defineModel('additionFieldsSetting', {
  default: []
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
    {{ additionFieldsSetting }}
  </div>
</template>
