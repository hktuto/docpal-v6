<template>
  <el-dialog v-model="state.visible" :title="t('collections_edit')" :close-on-click-modal="false" destroy-on-close>
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="Collection__EditCollectionInfo__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit">
        {{ t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import formJson from './editCollectionDialog.vform.json'
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'

const routerProvider = inject(MenuRouterKey)
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  data: {}
})

/**
 *
 * @param collection 收藏夾對象
 */
function handleOpen(collection: object) {
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.setFormData(collection)
  })
  state.visible = true
}

const emits = defineEmits([
  'refresh'
])

const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    state.loading = true
    let params = {
      idOrPath: data.id,
      name: data.name,
      description: null
    }
    const newVar = await clientApi.api.patchDmsCollection(params).then(res => res.data)
    ElMessage.success(t('tip_updateMsg', { modelName: null, name: data.name }))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {
    console.log(error)
  }
  state.loading = false
}

function getData() {
  return state.data
}

defineExpose({ handleOpen, getData })
</script>
