<template>
  <el-dialog v-model="state.visible" :title="$t('bulkImport_create')"
             :close-on-click-modal="false"
  >
    <FormRenderer ref="FormRendererRef" :form-json="formJson" />
    <template #footer>
      <el-button id="BulkImport__CreateNewBulkImport__Submit" type="primary" :loading="state.loading"
                 @click="handleSubmit()">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import { newClientApi, newAdminApi } from 'api'
import formJson from './addDocTypeForm.vfom.json'
import { ElMessage } from 'element-plus'

const routerProvider = inject(MenuRouterKey)
const { metaSettingData } = defineProps<{
  metaSettingData: any
}>()
const exitList = ref()
const emits = defineEmits([
  'refresh'
])
const { t } = useI18n()
const state = reactive<{
  loading: boolean,
  visible: boolean,
  allDocTypeList: any[]
}>({
  loading: false,
  visible: false,
  allDocTypeList: []
})
const FormRendererRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    const param = {
      documentType: data.type,
      isFolder: getIsFolder(data.type)
    }
    metaSettingData[param.documentType] = {
      isFolder: getIsFolder(data.type),
      related: []
    }
    await newAdminApi.putDmsSettingSystemSystemid('', metaSettingData)
    ElMessage.success(t('tip_createdSuccessMsg', {
      modelName: t('bulkImport_bulkImportForDocumentType'),
      name: data.type
    }))
    // await AddMetaSettingApi(param)
    FormRendererRef.value.vFormRenderRef.resetForm()
    emits('refresh')
    state.visible = false
  } catch (error) {
  }
  state.loading = false
}

function getIsFolder(type: string) {
  try {
    const data = state.allDocTypeList.find(item => item.name === type)
    return data.isFolder
  } catch (error) {
    return false
  }
}

function handleOpen(exitList: any) {
  state.visible = true

  nextTick(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
    handleOptions(exitList)
  })
}

async function handleOptions(exitList: any) {
  const idRef = FormRendererRef.value.vFormRenderRef.getWidgetRef('type')
  const options = listFilter()
  idRef.loadOptions(options)

  function listFilter() {
    return state.allDocTypeList.reduce((prev, item) => {
      const index = exitList.findIndex((exitItem: any) => exitItem.documentType === item.name)
      if (index === -1) {
        item.value = item.name
        item.label = t(item.name)
        prev.push(item)
      }
      return prev
    }, [])
  }
}

onMounted(async () => {
  const data: any = await newClientApi.getDmsDocpalTypeActive().then(r => r.data)
  state.allDocTypeList = data?.sort((a: any, b: any) => (a.name.localeCompare(b.name)))
})
defineExpose({ handleOpen })
</script>
<style lang="scss" scoped>

</style>
