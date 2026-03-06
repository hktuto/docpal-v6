<script lang="ts" setup>
const dialogEl = ref()
const props = defineProps<{
  buttonEl: any
}>()

const formEl = ref()
const defaultForm = {
  name: ''
}
const form = ref({ ...defaultForm })

function open() {
  if (props.buttonEl.$el) {
    dialogEl.value?.open(props.buttonEl.$el)
  } else {
    dialogEl.value?.open()
  }
}

function close() {
  dialogEl.value?.close()
}

async function submit() {}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiPopupDialog ref="dialogEl">
    <div class="formContainer">
      <ElFrom ref="formEl" label-position="top">
        <ElFormItem label="Form" required>
          <ElInput v-model="form.name" placeholder="Please enter form name" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="info" @click="close">Cancel</ElButton>
          <ElButton type="primary" @click="submit">Submit</ElButton>
        </ElFormItem>
      </ElFrom>
    </div>
  </UiPopupDialog>
</template>
