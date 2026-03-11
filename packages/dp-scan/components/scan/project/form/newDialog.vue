<script lang="ts" setup>
import { clientApi } from 'api'
import type { FormInstance, FormRules } from 'element-plus'
import { createScanFormDetailPageTab } from '#imports'

const dialogEl = ref()
const props = defineProps<{
  buttonEl: any
  projectId: string
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const formEl = ref<FormInstance>()
const loading = ref(false)

const defaultForm = {
  name: '',
  projectId: ''
}

const form = ref({ ...defaultForm })
const emits = defineEmits(['updated'])

// Validation rules
const rules: FormRules = {
  name: [
    { required: true, message: 'Please enter form name', trigger: 'blur' },
    { min: 2, max: 100, message: 'Length should be 2 to 100 characters', trigger: 'blur' }
  ]
}

function open() {
  // Reset form when opening and set projectId
  form.value = {
    ...defaultForm,
    projectId: props.projectId
  }
  nextTick(() => {
    formEl.value?.resetFields()
  })

  if (props.buttonEl?.$el) {
    dialogEl.value?.open(props.buttonEl.$el)
  } else {
    dialogEl.value?.open()
  }
}

function close() {
  dialogEl.value?.close()
}

async function submit() {
  if (!formEl.value) return

  const valid = await formEl.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const response = await clientApi.api.postCaptureProjformsetting(form.value)
    if (response.result) {
      emits('updated')
      close()
      // Navigate to form detail page with the new form ID
      const newFormId = response.data?.id
      if (newFormId) {
        const tab = createScanFormDetailPageTab(newFormId)
        routerProvider?.navigateTo(tab)
      }
    }
  } catch (error) {
    console.error('Failed to create form:', error)
  } finally {
    loading.value = false
  }
}

defineExpose({
  open,
  close
})
</script>

<template>
  <UiPopoverDialog ref="dialogEl">
    <div class="formContainer">
      <ElForm
        ref="formEl"
        :model="form"
        :rules="rules"
        label-position="top"
        class="formContent"
      >
        <ElFormItem label="Form" prop="name" required>
          <ElInput
            v-model="form.name"
            placeholder="Please enter form name"
            clearable
          />
        </ElFormItem>

        <ElFormItem class="formActions">
          <ElButton type="info" @click="close">Cancel</ElButton>
          <ElButton type="primary" :loading="loading" @click="submit">
            Submit
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped>
.formContainer {
  padding: var(--app-space-s);
  min-width: 280px;
}

.formContent {
  :deep(.el-form-item) {
    margin-bottom: var(--app-space-m);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.formActions {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-xs);
  margin-top: var(--app-space-m);
  padding-top: var(--app-space-s);
  border-top: 1px solid var(--app-border-color-light);
}
</style>
