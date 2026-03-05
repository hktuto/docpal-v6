<script setup lang="ts">
import { clientApi } from 'api'
const dialogEl = ref()
const formEl = ref()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

type FormState = {
  name: string
  description: string
  code: string
}

const defaultValues = {
  name: '',
  description: '',
  code: ''
}
const formState = ref<FormState>({
  ...defaultValues
})
const rules = reactive({
  code: [{ required: true, message: 'Please enter a code', trigger: 'blur' }],
  name: [{ required: true, message: 'Please enter a name', trigger: 'blur' }]
})
function open(el: HTMLElement) {
  dialogEl.value?.open(el)
  formState.value = { ...defaultValues }
}

async function submit() {
  try {
    console.log(formState.value)
    const result = await formEl.value?.validate()
    if (!result) {
      routerProvider?.message.error('Validation failed')
      return
    }
    const pjResponse = await clientApi.api.postCaptureProj(formState.value)
    if (!pjResponse || !pjResponse?.data) return
    const tab = createScanDetailPageTab(pjResponse.data)
    routerProvider?.navigateTo(tab)
    routerProvider?.message.success('Project created successfully')
    dialogEl.value?.close()
  } catch (error) {
    routerProvider?.message.error('Failed to create project')
  }
}

defineExpose({
  open
})
</script>

<template>
  <UiPopoverDialog ref="dialogEl">
    <div class="title">New Project</div>
    <ElForm ref="formEl" :model="formState" :rules="rules" label-position="top" @submit.prevent="submit">
      <ElFormItem label="Code" prop="code">
        <ElInput v-model="formState.code" />
      </ElFormItem>
      <ElFormItem label="Name" prop="name">
        <ElInput v-model="formState.name" />
      </ElFormItem>
      <ElFormItem label="Description" prop="description">
        <ElInput type="textarea" v-model="formState.description" />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="submit">Create</ElButton>
      </ElFormItem>
    </ElForm>
  </UiPopoverDialog>
</template>

<style scoped>
.title {
  font-size: var(--app-font-size-l);
  margin-bottom: var(--app-space-m);
}
</style>
