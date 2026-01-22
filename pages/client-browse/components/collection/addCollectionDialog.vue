<template>
  <el-dialog v-model="state.visible" :title="t('collections_new')" :close-on-click-modal="false" destroy-on-close>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="Collection_CreateNewCollection__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import formJson from './addCollectionDialog.vform.json'
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false
})

function handleOpen() {
  state.visible = true
}

const emits = defineEmits([
  'refresh',
  'success'
])

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data) return
    state.loading = true

    const cdata = await clientApi.api.postDmsCollection({
      name: data.name,
      description: null
    }).then(res => res.data)
    ElMessage.success(t('tip_createdMsg', {
      modelName: null,
      name: params.name
    }))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('success', cdata)
  } catch (error) {
    console.log(error)
    emits('refresh')
  }
  state.loading = false
}

defineExpose({ handleOpen })
</script>
