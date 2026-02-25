<template>
  <el-dialog v-model="state.visible"
             :title="state.isEdit ? $t('docType_editDisplayMeta') : $t('docType_addDisplayMeta')"
             :close-on-click-modal="false">
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="BulkImport__Meta__AddNewDisplayMeta__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit()">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import formJson from './adminMetaMapping.vform.json'
import { newAdminApi } from 'api'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const props = defineProps<{
  metaMapping: any,
  docType: any
}>()
const emits = defineEmits([
  'refresh'
])
const { t } = useI18n()
const state = reactive({
  loading: false,
  visible: false,
  isEdit: false,
  globalSchemaList: []
})
const FormRendererRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    const param = {
      name: props.docType.name,
      metaDataMapper: {
        ...props.metaMapping.metaDataMapper,
        [data.metaData]: data.label
      }
    }
    await newAdminApi.postDocpalWorkflowSavemetadatamapping({ documentType: [param] })
    ElMessage.success(t('bulkImport_displayMetaSuccessMsg', { name: data.metaData }))
    state.visible = false
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
  } catch (error) {
  }
  state.loading = false
}

function handleOpen(exitList: any, formData: any) {
  state.visible = true
  console.log('exitList', exitList)
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    handleOptions(exitList)
    if (!!formData) {
      formData.isEdit = true
      FormRendererRef.value.vFormRenderRef.setFormData(formData)
      state.isEdit = true
    } else {
      state.isEdit = false
    }
  })
}

async function handleOptions(exitList: any) {
  const idRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('metaData')
  const options = listFilter()
  idRef.loadOptions(options)

  function listFilter() {
    return state.globalSchemaList.reduce((prev: any, item: any) => {
      const index = exitList.findIndex((exitItem: any) => exitItem.metaData === item.name)
      item.value = item.name
      item.label = t(item.name)
      if (index !== -1) item.disabled = true
      prev.push(item)
      return prev
    }, [])
  }
}

onMounted(async () => {
  state.globalSchemaList = await newAdminApi.getDmsDocpalTypeDocumenttypeMetadata('GlobalFile').then(res => res.data?.keywords) as any
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
