<template>
  <el-dialog
    v-model="state.dialogVisible"
    :close-on-click-modal="false"
    append-to-body
    destroy-on-close
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="Search__Save__Add__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import formJson from './addDialog.vform.json'

const emits = defineEmits(['save'])
const state = reactive({
  loading: false,
  dialogVisible: false
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data) return
    emits('save', data)
    state.dialogVisible = false
  } catch (error) {
  } finally {
    state.loading = false
  }
}

function handleOpen() {
  state.dialogVisible = true
  // setTimeout(() => {
  //   FormRendererRef.value.vFormRenderRef.setFormData()
  // })
}

defineExpose({
  handleOpen
})
onMounted(async () => {
})
</script>

<style lang="scss" scoped></style>
