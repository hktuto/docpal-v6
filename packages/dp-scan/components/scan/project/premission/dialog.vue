<script lang="ts" setup>
const props = defineProps<{
  projectId: string
}>()
const btnEl = ref()
const dialogEl = ref()
const loading = ref(false)
async function getPremission() {
  loading.value = true
  try {
  } finally {
    loading.value = false
  }
}

async function open() {
  await getPremission()
  const el = btnEl.value?.$el
  dialogEl.value?.open(el)
}
</script>

<template>
  <ElButton ref="btnEl" type="info" :loading="loading" @click="open">Permission</ElButton>
  <UiPopoverDialog ref="dialogEl">
    <div class="title">Premission</div>
    Waiting API Implementation
  </UiPopoverDialog>
</template>

<style lang="scss" scoped></style>
