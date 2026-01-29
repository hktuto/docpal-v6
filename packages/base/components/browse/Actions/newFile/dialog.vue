<template>
  <el-dialog v-model="state.visible"
             :close-on-click-modal="false"
             @close="handleClose"
             class="scroll-dialog"
  >
    <template #header>
      <strong class="primaryTitle">{{ $t('filePopover_newFile') }}</strong>
      {{ 'in /' + state.setting.name }}
    </template>
    <!-- TODO : duplicate -->
    <FormRenderer ref="FormRendererRef" :form-json="formJson" @formChange="formChange"/>
    <MetaRenderForm2 ref="MetaFormRef"></MetaRenderForm2>
    <template #footer>
      <el-button id="Browse__NewFile__Submit" type="primary" :loading="state.loading" @click="handleSubmit">
        {{ $t('common_submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import {emitBus, EventType} from 'eventbus'
import {ElMessageBox} from 'element-plus'
import {useEventListener} from '@vueuse/core';
import {clientApi} from 'api';
import formJson from '../form/newFile.vform.json'

const emits = defineEmits([
  'success'
])
const state = reactive<any>({
  loading: false,
  visible: false,
  setting: {},
})
const FormRendererRef = ref()
const MetaFormRef = ref()

const tabProvider = inject(TabManagerKey)

function formChange({fieldName, newValue, oldValue, formModel}) {
  if (fieldName === 'documentType') MetaFormRef.value.init(newValue)
}

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    data.path = state.setting.path
    const _fileName = await getUniqueName({goPath: data.path, fileName: data.fileName})
    if (data.fileName !== _fileName) {
      const action = await ElMessageBox.confirm(`<h3>${$i18n.t('dpTip.duplicateFileName1', {fileName: _fileName})}</h3><div>${$i18n.t('dpTip.duplicateFileName2')}</div>`, {
        distinguishCancelAndClose: true,
        dangerouslyUseHTMLString: true
      })
      if (action === 'confirm') {
        data.fileName = _fileName
      } else {
        return
      }
    }
    let metaFormData = await MetaFormRef.value.getData()
    if (!metaFormData) {
      metaFormData = {}
      return
    }
    data.metaData = JSON.stringify(metaFormData)
    state.loading = true
    const docId = await clientApi.api.postDmsDocumentOffice(data).then(r => r.data)
    console.log("docId", docId)
    if (docId) {
      emitBus(EventType.FILE_NEED_REFRESH, {
        relatedIdOrPath: state.setting.id,
      })
      const newItem = createDetailPageParams({
        idOrPath: docId,
        docName: data.fileName,
        showHeaderAction: true,
      })
      tabProvider?.openTab(newItem)

      state.visible = false
      emits('success')
    }
  } catch (error) {
    console.log("error", error)
  } finally {

    state.loading = false
  }
}

function handleClose() {
  FormRendererRef.value.vFormRenderRef.resetForm()
}

function handleOpen(setting) {
  state.visible = true
  setTimeout(async () => {
    state.setting = setting
    await FormRendererRef.value.vFormRenderRef.setFormData({documentType: 'File'})
    state.loading = false
  })
}

onMounted(() => {
  useEventListener(document, 'docActionNewFile', (event: any) => handleOpen(event.detail))
})
defineExpose({handleOpen})

</script>
<style lang="scss" scoped>
// .footer-grid {
//     display: grid;
//     grid-template-columns: 1fr min-content min-content;
//     text-align: left;
// }
</style>
