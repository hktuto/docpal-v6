<template>
  <el-dialog v-model="state.visible" :title="isEdit ? t('collections_edit') : t('collections_new')">
    <el-form label-position="top" ref="FormRef" :model="form">
      <el-form-item :label="t('collection_name')" :rules="rule" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="Collection_CreateOrEditCollection__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { newClientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false
})
const FormRef = ref()
const collectionId = ref()
const form = reactive({ name: '' })
const isEdit = ref(false)
const emits = defineEmits(['refresh', 'success'])

const rule = [{
  required: true,
  message: () => t('render.hint.fieldRequired', { name: t('collection_name') }),
  trigger: 'blur'
}]

function handleOpen(row?: any) {
  state.visible = true
  if (!!row) {
    form.name = row.name
    collectionId.value = row.id
    isEdit.value = true
  } else {
    form.name = ''
    isEdit.value = false
  }
}

async function handleSubmit() {
  try {
    await FormRef.value?.validate()
    state.loading = true
    if (isEdit.value) {
      await newClientApi.patchDmsCollection({ idOrPath: collectionId.value, name: form.name })
      routerProvider?.message.success(t('tip_updateMsg', { modelName: null, name: form.name }))
      emits('refresh', { id: collectionId.value, name: form.name })
    } else {
      const data = await newClientApi.postDmsCollection({ name: form.name }).then(res => res.data)
      routerProvider?.message.success(t('tip_createdMsg', { modelName: null, name: form.name }))
      emits('success', data)
    }
    state.visible = false
  } catch (error) {
    if (state.loading) {
      console.log(error)
      state.visible = false
    }
  } finally {
    state.loading = false
  }
}

defineExpose({ handleOpen })
</script>
