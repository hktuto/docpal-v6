<script lang="ts" setup>
import { clientApi } from 'api'
import type { FormInstance, FormRules } from 'element-plus'

const dialogEl = ref()
const props = defineProps<{
  buttonEl?: any
}>()

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey not found')
}

const formEl = ref<FormInstance>()
const loading = ref(false)

const defaultForm = {
  id: '',
  name: ''
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

function open(formId: string, originalName: string) {
  // Reset form when opening and set formId with default name
  form.value = {
    id: formId,
    name: `${originalName} (Copy)`
  }
  nextTick(() => {
    formEl.value?.resetFields()
    // Set the name again after resetFields
    form.value.name = `${originalName} (Copy)`
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
    const response = await clientApi.api.postCaptureProjformsettingDuplicate({
      id: form.value.id,
      name: form.value.name
    })
    if (response.result) {
      routerProvider?.message.success('Form duplicated successfully')
      emits('updated')
      close()
    }
  } catch (error) {
    console.error('Failed to duplicate form:', error)
    routerProvider?.message.error('Failed to duplicate form')
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
        <ElFormItem label="New Form Name" prop="name" required>
          <ElInput
            v-model="form.name"
            placeholder="Please enter new form name"
            clearable
          />
        </ElFormItem>

        <ElFormItem class="formActions">
          <ElButton type="info" @click="close">Cancel</ElButton>
          <ElButton type="primary" :loading="loading" @click="submit">
            Duplicate
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
