<template>
  <!-- <div class="actionIconContainer" @click="uploadDialog"> -->
  <div>
    <BrowseActionsButton id="uploadRequestActionButton" :label="$t('publicUpload_requestFileUpload')" @click="uploadDialog">
      <el-tooltip :content="t('document_uploadRequest')">
        <div class="iconWrapper">
          <Icon name="lucide:file-plus" />
        </div>
      </el-tooltip>
      <!-- <SvgIcon src="/icons/file/uploadRequest.svg" round :content="t('document_uploadRequest')"
      ></SvgIcon> -->
    </BrowseActionsButton>
    <!-- <el-tooltip content="upload request">
        <el-icon >
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728=""><path fill="currentColor" d="M544 864V672h128L512 480 352 672h128v192H320v-1.6c-5.376.32-10.496 1.6-16 1.6A240 240 0 0 1 64 624c0-123.136 93.12-223.488 212.608-237.248A239.808 239.808 0 0 1 512 192a239.872 239.872 0 0 1 235.456 194.752c119.488 13.76 212.48 114.112 212.48 237.248a240 240 0 0 1-240 240c-5.376 0-10.56-1.28-16-1.6v1.6H544z"></path></svg>
        </el-icon>
    </el-tooltip> -->
    <el-dialog
      v-model="state.dialogOpened"
      class="scroll-dialog"
      append-to-body
      :close-on-click-modal="false"
      :title="`${$t('publicUpload_requestFileUpload')}`"
    >
      <FormRenderer ref="FormRendererRef" :form-json="formJson" />
      <template #footer>
        <el-button id="Browse__FileUploadRequest__Confirm" :loading="state.loading" type="primary" @click="handleSubmit">
          {{ $t('dpButtom_confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { clientApi } from 'api'
import formJson from './form/clientFileRequest.vform.json'

const emits = defineEmits(['success'])
const props = defineProps<{
  doc?: any
}>()
const state = reactive({
  loading: false,
  dialogOpened: false
})
const { t } = useI18n()

function uploadDialog() {
  state.dialogOpened = true
  setTimeout(() => {
    FormRendererRef.value.vFormRenderRef.resetForm()
  })
  // open upload dialog
}

// #region module:
const FormRendererRef = ref()

async function handleSubmit() {
  state.loading = true
  try {
    const data = await FormRendererRef.value.getFormData()
    if (!data) throw new Error(`${t('incompleteData')}`)
    if (data.expiredAt) data.expiredAt = data.expiredAt.replace(/.000.*$/, 'Z')
    data.message = data.message.replace(/\r\n|\r|\n/g, '<br/>')
    data.idOrPath = props.doc.path
    if (data.fileType) data.fileType = data.fileType.join(',')
    const res: any = await clientApi.api.postDmsUploadRequest(data).then((res) => res.data)
    state.loading = false
    if (res?.errorCode) throw new Error(res.message || 'error')
    state.dialogOpened = false
    ElMessage.success(t('tip_createdMsg', { modelName: null, name: t('document_uploadFilesRequest') }))
    // ElMessage.success(t('publicUpload_success'))
    emits('success')
  } catch (error) {
    // routerProvider?.message.error(error.message)
  }
  state.loading = false
}

// #endregion
</script>

<style lang="scss" scoped>
.iconWrapper {
  cursor: pointer;
  font-size: var(--icon-size, 18px);
  width: var(--icon-bg-size, 32px);
  height: var(--icon-bg-size, 32px);
  color: var(--icon-color, --app-grey-900) !important;
  background-color: var(--icon-bg-color, var(--app-grey-900));
  border-radius: 50%;
  display: grid;
  place-items: center;
}
</style>
